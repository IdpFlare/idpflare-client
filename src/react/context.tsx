/**
 * React Context for IDPFlare authentication
 */

import { createContext, useContext } from "react";
import type { IdPFlareClient } from "../core/client";
import type { AccountInfo, TokenData, UserInfo, IdTokenClaims, AuthenticationResult, LoginRequest } from "../core/types";

/**
 * Authentication state exposed by the context
 */
export interface IdPFlareContextState {
  /**
   * Whether authentication state is still being determined
   */
  isLoading: boolean;

  /**
   * Whether the user is currently authenticated
   */
  isAuthenticated: boolean;

  /**
   * Whether the user is currently logging out
   * This prevents useRequireAuth from triggering login during logout
   */
  isLoggingOut: boolean;

  /**
   * Current user account info (if authenticated)
   */
  account: AccountInfo | null;

  /**
   * Any authentication error that occurred
   */
  error: string | null;
}

/**
 * Authentication actions exposed by the context
 */
export interface IdPFlareContextActions {
  /**
   * Start the login flow
   */
  login: (request?: LoginRequest) => Promise<void>;

  /**
   * Log out the user
   */
  logout: (options?: { redirect?: boolean }) => void;

  /**
   * Get the current access token (may refresh if expired)
   */
  getAccessToken: () => Promise<string | null>;

  /**
   * Get all stored tokens
   */
  getTokens: () => TokenData;

  /**
   * Get parsed ID token claims
   */
  getIdTokenClaims: () => IdTokenClaims | null;

  /**
   * Fetch user info from the userinfo endpoint
   */
  getUserInfo: () => Promise<UserInfo | null>;

  /**
   * Handle the OAuth callback (typically called automatically by provider)
   */
  handleCallback: (url?: string) => Promise<{ success: boolean; error?: string; result?: AuthenticationResult }>;

  /**
   * The underlying client instance for advanced usage
   */
  client: IdPFlareClient;
}

/**
 * Full context value combining state and actions
 */
export type IdPFlareContextValue = IdPFlareContextState & IdPFlareContextActions;

/**
 * Default context value (throws if used outside provider)
 */
const defaultContextValue: IdPFlareContextValue = {
  isLoading: true,
  isAuthenticated: false,
  isLoggingOut: false,
  account: null,
  error: null,
  login: () => {
    throw new Error("IdPFlareProvider not found");
  },
  logout: () => {
    throw new Error("IdPFlareProvider not found");
  },
  getAccessToken: () => {
    throw new Error("IdPFlareProvider not found");
  },
  getTokens: () => {
    throw new Error("IdPFlareProvider not found");
  },
  getIdTokenClaims: () => {
    throw new Error("IdPFlareProvider not found");
  },
  getUserInfo: () => {
    throw new Error("IdPFlareProvider not found");
  },
  handleCallback: () => {
    throw new Error("IdPFlareProvider not found");
  },
  client: null as unknown as IdPFlareClient,
};

/**
 * React context for IDPFlare authentication
 */
export const IdPFlareContext = createContext<IdPFlareContextValue>(defaultContextValue);

/**
 * Hook to access the IDPFlare authentication context
 * Must be used within an IdPFlareProvider
 */
export function useIdPFlareContext(): IdPFlareContextValue {
  const context = useContext(IdPFlareContext);
  if (context.client === null) {
    throw new Error("useIdPFlareContext must be used within an IdPFlareProvider");
  }
  return context;
}

