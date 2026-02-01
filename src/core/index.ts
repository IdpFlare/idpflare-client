/**
 * Core exports for IDPFlare client
 */

// Client
export { IdPFlareClient, createIdPFlareClient } from "./client";

// API (for custom UIs)
export { IdPFlareApi, createIdPFlareApi } from "./api";

// Types
export type {
  IdPFlareConfig,
  TokenResponse,
  TokenData,
  UserInfo,
  IdTokenClaims,
  DiscoveryDocument,
  AuthenticationResult,
  CallbackResult,
  LoginRequest,
  IdPFlareEventType,
  IdPFlareEventHandler,
  IdPFlareEvent,
  AccountInfo,
} from "./types";

// API Types
export type {
  RegisterRequest,
  RegisterResult,
  LoginCredentialsRequest,
  LoginCredentialsResult,
  MfaVerifyRequest,
  MfaVerifyResult,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  ResetPasswordRequest,
  ResetPasswordResult,
  ChangePasswordRequest,
  ChangePasswordResult,
  SsoProvider,
  SsoProvidersResult,
  SsoStartRequest,
  SsoStartResult,
  ResendVerificationRequest,
  ResendVerificationResult,
} from "./api-types";

// Storage
export { TokenStorage } from "./storage";
export type { ITokenStorage, StorageKeys } from "./storage";

// PKCE utilities (for advanced usage)
export {
  generateRandomString,
  generateCodeChallenge,
  generatePKCEPair,
  generateState,
  generateNonce,
} from "./pkce";
