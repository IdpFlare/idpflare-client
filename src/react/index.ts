/**
 * React bindings for IDPFlare client
 */

// Context
export { IdPFlareContext, useIdPFlareContext } from "./context";
export type { IdPFlareContextState, IdPFlareContextActions, IdPFlareContextValue } from "./context";

// Provider
export { IdPFlareProvider } from "./provider";
export type { IdPFlareProviderProps } from "./provider";

// Hooks
export {
  useIdPFlare,
  useIsAuthenticated,
  useAccount,
  useAuth,
  useUserInfo,
  useIdTokenClaims,
  useTokens,
  useAccessToken,
  useAuthenticatedFetch,
  useRequireAuth,
} from "./hooks";

