import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

// For demo purposes, we'll use a mock authentication
// TODO: Replace with actual Cognito authentication when deploying
export async function signIn(username: string, password: string) {
  // Demo credentials
  if (username === "demo" && password === "demo123") {
    return {
      AccessToken: "mock-token",
      IdToken: "mock-id-token",
      RefreshToken: "mock-refresh-token",
    };
  }

  throw new Error("Invalid credentials. Use demo/demo123 for testing.");
}

// Keep the actual implementation commented for later use
/*
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

export async function signIn(username: string, password: string) {
  if (!CLIENT_ID) {
    throw new Error("Cognito Client ID not configured");
  }

  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });

  const response = await cognitoClient.send(command);
  return response.AuthenticationResult;
}
*/