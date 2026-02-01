/**
 * React bindings for IDPFlare client
 */

// Context
export { IdPFlareContext, useIdPFlareContext } from "./context";
export type { IdPFlareContextState, IdPFlareContextActions, IdPFlareContextValue } from "./context";

// Provider
export { IdPFlareProvider } from "./provider";
export type { IdPFlareProviderProps } from "./provider";

// OAuth Hooks
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

// API Hooks (for custom UIs)
export {
  useRegister,
  useLoginWithCredentials,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  useSsoProviders,
  useStartSso,
} from "./hooks-api";

export type {
  UseRegisterResult,
  UseLoginCredentialsResult,
  UseForgotPasswordResult,
  UseResetPasswordResult,
  UseChangePasswordResult,
  UseSsoProvidersResult,
  UseStartSsoResult,
} from "./hooks-api";
