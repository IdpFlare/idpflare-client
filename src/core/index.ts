/**
 * Core exports for IDPFlare client
 */

// Client
export { IdPFlareClient, createIdPFlareClient } from "./client";

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

