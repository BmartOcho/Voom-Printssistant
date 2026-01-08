/**
 * Canva OAuth2 Authentication Service
 * Handles OAuth flow, token management, and refresh logic with PKCE support
 */

import crypto from "node:crypto";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  userId: string;
  scope: string;
}

export interface CanvaAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generate PKCE code_verifier and code_challenge pair
 * Following RFC 7636 specification for OAuth 2.0 PKCE
 */
export function generatePKCEPair(): PKCEPair {
  // Generate code_verifier: 96 bytes = 128 base64url characters
  // Must be 43-128 characters long, using base64url encoding
  const codeVerifier = crypto.randomBytes(96).toString("base64url");
  
  // Generate code_challenge: SHA-256 hash of code_verifier, base64url encoded
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

/**
 * Generate OAuth authorization URL with PKCE
 */
export function generateAuthUrl(
  config: CanvaAuthConfig, 
  state: string,
  codeChallenge: string
): string {
  // Scopes must match what's configured in Canva Developer Portal
  const scopes = [
    "folder:read",
    "folder:permission:read", // May be needed for organization folders
    "design:meta:read",
    "design:content:read",
    "design:content:write",
    "asset:read",
    "brandtemplate:meta:read",
    "brandtemplate:content:read",
  ];

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256", // SHA-256
  });

  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token (with PKCE)
 */
export async function exchangeCodeForToken(
  config: CanvaAuthConfig,
  code: string,
  codeVerifier: string
): Promise<TokenData> {
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier, // PKCE requirement
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user?.id || "unknown",
    scope: data.scope || "",
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  config: CanvaAuthConfig,
  refreshToken: string
): Promise<TokenData> {
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some APIs don't return new refresh token
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user?.id || "unknown",
    scope: data.scope || "",
  };
}

/**
 * Generate a cryptographically secure random state for OAuth
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(tokenData: TokenData): boolean {
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return Date.now() + bufferMs >= tokenData.expiresAt;
}
