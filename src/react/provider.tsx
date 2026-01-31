/**
 * React Provider for IDPFlare authentication
 */

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { IdPFlareClient, createIdPFlareClient } from "../core/client";
import { IdPFlareContext, type IdPFlareContextValue } from "./context";
import type { IdPFlareConfig, AccountInfo, LoginRequest } from "../core/types";

/**
 * Props for the IdPFlareProvider component
 */
export interface IdPFlareProviderProps {
  /**
   * IDPFlare configuration
   */
  config: IdPFlareConfig;

  /**
   * Child components
   */
  children: ReactNode;

  /**
   * Whether to automatically handle callback on mount if URL contains OAuth params
   * @default true
   */
  autoHandleCallback?: boolean;

  /**
   * Callback when login succeeds
   */
  onLoginSuccess?: (account: AccountInfo) => void;

  /**
   * Callback when login fails
   */
  onLoginError?: (error: string) => void;

  /**
   * Callback when user logs out
   */
  onLogout?: () => void;

  /**
   * Optional pre-created client instance
   */
  client?: IdPFlareClient;
}

/**
 * Provider component that wraps your app and provides authentication context
 */
export function IdPFlareProvider({
  config,
  children,
  autoHandleCallback = true,
  onLoginSuccess,
  onLoginError,
  onLogout,
  client: externalClient,
}: IdPFlareProviderProps): ReactNode {
  // Create or use provided client
  const client = useMemo(() => externalClient ?? createIdPFlareClient(config), [config, externalClient]);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update authentication state
  const updateAuthState = useCallback(() => {
    const authenticated = client.isAuthenticated();
    setIsAuthenticated(authenticated);
    setAccount(authenticated ? client.getAccount() : null);
  }, [client]);

  // Handle OAuth callback if present in URL
  useEffect(() => {
    const init = async () => {
      // Check if this is an OAuth callback
      const searchParams = new URLSearchParams(window.location.search);
      const hasCode = searchParams.has("code");
      const hasError = searchParams.has("error");

      if (autoHandleCallback && (hasCode || hasError)) {
        const result = await client.handleCallback();
        if (result.success) {
          updateAuthState();
          const acc = client.getAccount();
          if (acc) {
            onLoginSuccess?.(acc);
          }
        } else if (result.error) {
          setError(result.error);
          onLoginError?.(result.error);
        }
      } else {
        // Just check existing auth state
        updateAuthState();
      }

      setIsLoading(false);
    };

    init();
  }, [client, autoHandleCallback, updateAuthState, onLoginSuccess, onLoginError]);

  // Set up event listeners
  useEffect(() => {
    const unsubLoginSuccess = client.on("loginSuccess", () => {
      updateAuthState();
      const acc = client.getAccount();
      if (acc) {
        onLoginSuccess?.(acc);
      }
    });

    const unsubLoginError = client.on("loginError", (event) => {
      const errorMsg = typeof event.payload === "object" && event.payload !== null
        ? (event.payload as { error?: string }).error ?? "Login failed"
        : "Login failed";
      setError(errorMsg);
      onLoginError?.(errorMsg);
    });

    const unsubLogout = client.on("logoutComplete", () => {
      setIsAuthenticated(false);
      setAccount(null);
      onLogout?.();
    });

    const unsubSessionExpired = client.on("sessionExpired", () => {
      setIsAuthenticated(false);
      setAccount(null);
    });

    const unsubTokenRefresh = client.on("tokenRefresh", () => {
      updateAuthState();
    });

    return () => {
      unsubLoginSuccess();
      unsubLoginError();
      unsubLogout();
      unsubSessionExpired();
      unsubTokenRefresh();
    };
  }, [client, updateAuthState, onLoginSuccess, onLoginError, onLogout]);

  // Actions
  const login = useCallback(
    async (request?: LoginRequest) => {
      setError(null);
      await client.login(request);
    },
    [client]
  );

  const logout = useCallback(
    (options?: { redirect?: boolean }) => {
      client.logout(options);
    },
    [client]
  );

  const getAccessToken = useCallback(() => client.getAccessTokenSilent(), [client]);

  const getTokens = useCallback(() => client.getTokens(), [client]);

  const getIdTokenClaims = useCallback(() => client.getIdTokenClaims(), [client]);

  const getUserInfo = useCallback(() => client.getUserInfo(), [client]);

  const handleCallback = useCallback(
    async (url?: string) => {
      const result = await client.handleCallback(url);
      if (result.success) {
        updateAuthState();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    },
    [client, updateAuthState]
  );

  // Context value
  const value: IdPFlareContextValue = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      account,
      error,
      login,
      logout,
      getAccessToken,
      getTokens,
      getIdTokenClaims,
      getUserInfo,
      handleCallback,
      client,
    }),
    [
      isLoading,
      isAuthenticated,
      account,
      error,
      login,
      logout,
      getAccessToken,
      getTokens,
      getIdTokenClaims,
      getUserInfo,
      handleCallback,
      client,
    ]
  );

  return <IdPFlareContext.Provider value={value}>{children}</IdPFlareContext.Provider>;
}

