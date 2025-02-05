import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';


/**
 * Infrastructure stack for Jivana Health Platform
 * 
 * Current Architecture:
 * - Authentication: AWS Cognito User Pool
 * - Storage: S3 for files, RDS PostgreSQL for data
 * - Networking: VPC with public/private subnets
 * 
 * Data Flow:
 * 1. User authenticates via Cognito
 * 2. Frontend uploads blood test PDFs to S3
 * 3. Test data stored in RDS PostgreSQL
 * 4. GPT analysis runs on Express server
 * 
 * Future Improvements:
 * - Add Lambda for async GPT processing
 * - Use ECS for Express server scaling
 * - Implement SQS for upload processing
 */

/**
 * Production-ready enhancements for Jivana Platform
 * TODO: Uncomment and implement these components for production deployment
 * 
 * Enhanced Architecture:
 * 1. Upload Flow:
 *    - Frontend → S3 (PDF upload)
 *    - S3 event → Lambda trigger
 *    - Lambda → SQS (queues processing request)
 *    - ECS tasks process queue messages
 * 
 * 2. Analysis Flow:
 *    - ECS container reads from queue
 *    - Processes blood test data
 *    - Calls OpenAI API
 *    - Updates RDS with results
 * 
 * 3. High Availability:
 *    - Multiple ECS tasks across AZs
 *    - RDS Multi-AZ deployment
 *    - CloudFront for frontend assets
 *    - Application Load Balancer
 */
export class JivanaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tags for all resources
    cdk.Tags.of(this).add('Project', 'Jivana');
    cdk.Tags.of(this).add('Environment', 'Development');

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'JivanaUserPool', {
      userPoolName: 'jivana-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    // Create User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'JivanaUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // Create S3 bucket for blood test files
    const bloodTestsBucket = new s3.Bucket(this, 'JivanaBloodTestsBucket', {
      bucketName: 'jivana-blood-tests',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // TODO: Restrict to app domain
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create VPC for RDS and ECS
    const vpc = new ec2.Vpc(this, 'JivanaVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'JivanaDBSecurityGroup', {
      vpc,
      description: 'Security group for Jivana RDS instance',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC',
    );

    // Create RDS instance with Multi-AZ for production
    const dbInstance = new rds.DatabaseInstance(this, 'JivanaDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      securityGroups: [dbSecurityGroup],
      databaseName: 'jivana',
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      storageEncrypted: true,
      multiAz: true, // Enable Multi-AZ for production
    });

    // SQS Queue for processing uploaded tests
    const uploadQueue = new sqs.Queue(this, 'TestUploadQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda function for processing uploads
    const uploadProcessor = new lambda.Function(this, 'UploadProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/upload-processor'),
      environment: {
        QUEUE_URL: uploadQueue.queueUrl,
      },
    });

    // Security group for ECS tasks
    const apiSecurityGroup = new ec2.SecurityGroup(this, 'ApiSecurityGroup', {
      vpc,
      description: 'Security group for API containers',
      allowAllOutbound: true,
    });

    // ECS Cluster setup
    const cluster = new ecs.Cluster(this, 'JivanaCluster', {
      vpc,
      containerInsights: true,
    });

    // Task Definition for API
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Container Definition
    const container = taskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromAsset('../'),
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: dbInstance.instanceEndpoint.socketAddress,
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'JivanaApi' }),
    });

    container.addPortMappings({
      containerPort: 5000,
    });

    // ECS Service with Auto Scaling
    const service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [apiSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });


    // Output values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'BloodTestsBucketName', {
      value: bloodTestsBucket.bucketName,
      description: 'S3 Bucket name for blood test files',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
    });
  }
}