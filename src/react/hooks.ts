/**
 * React Hooks for IDPFlare authentication
 */

import { useCallback, useEffect, useState } from "react";
import { useIdPFlareContext } from "./context";
import type { UserInfo, IdTokenClaims, TokenData, LoginRequest } from "../core/types";

/**
 * Main hook for accessing IDPFlare authentication
 * Returns authentication state and actions
 */
export function useIdPFlare() {
  return useIdPFlareContext();
}

/**
 * Hook for checking authentication status
 * Returns { isLoading, isAuthenticated }
 */
export function useIsAuthenticated() {
  const { isLoading, isAuthenticated } = useIdPFlareContext();
  return { isLoading, isAuthenticated };
}

/**
 * Hook for getting the current account
 * Returns the account info if authenticated, null otherwise
 */
export function useAccount() {
  const { account, isLoading } = useIdPFlareContext();
  return { account, isLoading };
}

/**
 * Hook for login/logout actions
 */
export function useAuth() {
  const { login, logout, isAuthenticated, isLoggingOut, isLoading, error } = useIdPFlareContext();

  return {
    login,
    logout,
    isAuthenticated,
    isLoggingOut,
    isLoading,
    error,
  };
}

/**
 * Hook for fetching user info
 * Automatically fetches when authenticated
 */
export function useUserInfo() {
  const { isAuthenticated, getUserInfo } = useIdPFlareContext();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setUserInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await getUserInfo();
      setUserInfo(info);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getUserInfo]);

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    } else {
      setUserInfo(null);
    }
  }, [isAuthenticated, refetch]);

  return { userInfo, loading, error, refetch };
}

/**
 * Hook for getting ID token claims
 */
export function useIdTokenClaims(): IdTokenClaims | null {
  const { getIdTokenClaims, isAuthenticated } = useIdPFlareContext();
  const [claims, setClaims] = useState<IdTokenClaims | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setClaims(getIdTokenClaims());
    } else {
      setClaims(null);
    }
  }, [isAuthenticated, getIdTokenClaims]);

  return claims;
}

/**
 * Hook for getting tokens
 */
export function useTokens(): TokenData {
  const { getTokens } = useIdPFlareContext();
  return getTokens();
}

/**
 * Hook for getting an access token for API calls
 * Returns a function that gets a valid token (refreshing if needed)
 */
export function useAccessToken() {
  const { getAccessToken, isAuthenticated } = useIdPFlareContext();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      return null;
    }
    return getAccessToken();
  }, [isAuthenticated, getAccessToken]);

  return getToken;
}

/**
 * Hook for making authenticated fetch requests
 * Returns a fetch function that automatically adds auth headers
 */
export function useAuthenticatedFetch() {
  const { client } = useIdPFlareContext();

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      return client.fetch(input, init);
    },
    [client]
  );

  return authFetch;
}

/**
 * Higher-order hook that redirects to login if not authenticated
 * Useful for protected routes
 */
export function useRequireAuth(options?: {
  loginRequest?: LoginRequest;
  redirectOnUnauthenticated?: boolean;
}) {
  const { isLoading, isAuthenticated, isLoggingOut, login, account } = useIdPFlareContext();
  const { loginRequest, redirectOnUnauthenticated = true } = options ?? {};

  useEffect(() => {
    // Don't redirect to login if we're currently logging out
    if (!isLoading && !isAuthenticated && !isLoggingOut && redirectOnUnauthenticated) {
      login(loginRequest);
    }
  }, [isLoading, isAuthenticated, isLoggingOut, login, loginRequest, redirectOnUnauthenticated]);

  return {
    isLoading,
    isAuthenticated,
    account,
  };
}

