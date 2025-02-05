# Jivana Health Tech Platform

A comprehensive health analytics platform that helps users manage and understand their blood test results using AI-powered insights.

## Features

- 🔒 Secure Authentication with AWS Cognito
- 📊 Interactive Dashboard for Blood Test Visualization
- 🤖 AI-Powered Health Insights using GPT-4o
- 📁 Secure File Storage with AWS S3
- 📱 Responsive Design
- 📊 Historical Data Tracking
- 🔗 Secure Test Result Sharing

## Tech Stack

- **Frontend**: React, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Drizzle ORM
- **Database**: PostgreSQL
- **Cloud Services**: AWS (S3, Cognito, RDS)
- **AI**: OpenAI GPT-4o API
- **Infrastructure**: AWS CDK

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── lib/          # Utility functions and API clients
│   │   └── hooks/        # Custom React hooks
├── server/                # Express.js backend
│   ├── services/         # External service integrations (AWS, OpenAI)
│   └── routes.ts         # API route handlers
├── shared/               # Shared types and schemas
└── infra/               # AWS CDK infrastructure code
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
DATABASE_URL=
OPENAI_API_KEY=
VITE_COGNITO_CLIENT_ID=
```

3. Initialize the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

## Infrastructure Deployment

The project includes AWS CDK code for deploying:
- Cognito User Pool for authentication
- S3 bucket for blood test file storage
- RDS PostgreSQL instance
- Required security groups and VPC configuration

To deploy:
```bash
cd infra
npm run cdk deploy
```

## Development Guidelines

- Use TanStack Query for data fetching
- Follow the existing component structure
- Use shadcn/ui components for consistent styling
- Validate forms with Zod schemas
- Use the storage interface for database operations
- Keep API routes thin, business logic in services

## Security Considerations

- All file uploads are stored in a private S3 bucket
- Database is in a private subnet
- Authentication required for all sensitive operations
- Test sharing uses secure one-time tokens
