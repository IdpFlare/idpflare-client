/**
 * IDPFlare Client Types
 */

/**
 * Configuration options for the IDPFlare client
 */
export interface IdPFlareConfig {
  /**
   * The base URL of your IDPFlare instance
   * @example "https://auth.example.com"
   */
  authority: string;

  /**
   * The OAuth client ID registered in IDPFlare
   */
  clientId: string;

  /**
   * The redirect URI for OAuth callbacks
   * Must match the URI registered in IDPFlare
   */
  redirectUri: string;

  /**
   * Optional post-logout redirect URI
   * Where users will be sent after logging out
   */
  postLogoutRedirectUri?: string;

  /**
   * OAuth scopes to request
   * @default ["openid", "profile", "email"]
   */
  scopes?: string[];

  /**
   * Enable automatic token refresh
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Buffer time (in seconds) before token expiry to trigger refresh
   * @default 60
   */
  refreshBuffer?: number;

  /**
   * Storage mechanism to use for tokens
   * @default "localStorage"
   */
  storage?: "localStorage" | "sessionStorage" | "memory";

  /**
   * Custom storage key prefix
   * @default "idpflare"
   */
  storageKeyPrefix?: string;
}

/**
 * Token response from the OAuth token endpoint
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

/**
 * Stored token data
 */
export interface TokenData {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  scope: string | null;
}

/**
 * User info from the OIDC userinfo endpoint
 */
export interface UserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: unknown;
}

/**
 * Parsed ID token claims
 */
export interface IdTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  at_hash?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: unknown;
}

/**
 * OIDC Discovery document
 */
export interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  end_session_endpoint?: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  scopes_supported?: string[];
  claims_supported?: string[];
  code_challenge_methods_supported?: string[];
  [key: string]: unknown;
}

/**
 * Authentication result returned after successful login
 */
export interface AuthenticationResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  scope: string;
  idTokenClaims?: IdTokenClaims;
}

/**
 * Callback result from handling OAuth redirect
 */
export interface CallbackResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
  result?: AuthenticationResult;
}

/**
 * Login request options
 */
export interface LoginRequest {
  /**
   * Additional scopes to request (merged with config scopes)
   */
  scopes?: string[];

  /**
   * Force user to re-authenticate
   */
  prompt?: "none" | "login" | "consent" | "select_account";

  /**
   * Hint for which account to use
   */
  loginHint?: string;

  /**
   * State to pass through the OAuth flow
   */
  state?: string;

  /**
   * Additional query parameters to include
   */
  extraQueryParams?: Record<string, string>;
}

/**
 * Event types emitted by the client
 */
export type IdPFlareEventType =
  | "loginStart"
  | "loginSuccess"
  | "loginError"
  | "logoutStart"
  | "logoutComplete"
  | "tokenRefresh"
  | "tokenRefreshError"
  | "sessionExpired";

/**
 * Event handler function type
 */
export type IdPFlareEventHandler = (event: IdPFlareEvent) => void;

/**
 * Event object passed to event handlers
 */
export interface IdPFlareEvent {
  type: IdPFlareEventType;
  payload?: unknown;
  timestamp: number;
}

/**
 * Account information (simplified user representation)
 */
export interface AccountInfo {
  id: string;
  email?: string;
  name?: string;
  idTokenClaims?: IdTokenClaims;
}

