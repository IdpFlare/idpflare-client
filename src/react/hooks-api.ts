/**
 * React hooks for IDPFlare API
 * 
 * These hooks provide React integration for the direct authentication API.
 * Use these when building custom login, registration, and password reset UIs.
 */

import { useState, useCallback, useEffect } from "react";
import { useIdPFlareContext } from "./context";
import type {
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
} from "../core/api-types";

// ============================================================================
// REGISTRATION
// ============================================================================

export interface UseRegisterResult {
    register: (request: RegisterRequest) => Promise<RegisterResult>;
    isLoading: boolean;
    error: string | null;
    result: RegisterResult | null;
    reset: () => void;
}

/**
 * Hook for user registration
 * 
 * @example
 * ```tsx
 * function RegisterForm() {
 *   const { register, isLoading, error, result } = useRegister();
 * 
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *     await register({ email, password, name });
 *   };
 * 
 *   if (result?.success && result.requiresVerification) {
 *     return <p>Check your email to verify your account!</p>;
 *   }
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <p className="error">{error}</p>}
 *       <input name="email" type="email" />
 *       <input name="password" type="password" />
 *       <button disabled={isLoading}>Register</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useRegister(): UseRegisterResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<RegisterResult | null>(null);

    const register = useCallback(
        async (request: RegisterRequest): Promise<RegisterResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.register(request);
                setResult(res);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Registration failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const reset = useCallback(() => {
        setError(null);
        setResult(null);
    }, []);

    return { register, isLoading, error, result, reset };
}

// ============================================================================
// LOGIN
// ============================================================================

export interface UseLoginCredentialsResult {
    login: (request: LoginCredentialsRequest) => Promise<LoginCredentialsResult>;
    verifyMfa: (request: MfaVerifyRequest) => Promise<MfaVerifyResult>;
    isLoading: boolean;
    error: string | null;
    result: LoginCredentialsResult | null;
    mfaRequired: boolean;
    mfaSessionId: string | null;
    availableMethods: string[];
    reset: () => void;
}

/**
 * Hook for credential-based login with MFA support
 * 
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { login, verifyMfa, isLoading, error, mfaRequired, availableMethods } = useLoginWithCredentials();
 * 
 *   if (mfaRequired) {
 *     return <MfaForm verifyMfa={verifyMfa} methods={availableMethods} />;
 *   }
 * 
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); login({ email, password }); }}>
 *       {error && <p className="error">{error}</p>}
 *       <input name="email" type="email" />
 *       <input name="password" type="password" />
 *       <button disabled={isLoading}>Login</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useLoginWithCredentials(): UseLoginCredentialsResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LoginCredentialsResult | null>(null);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaSessionId, setMfaSessionId] = useState<string | null>(null);
    const [availableMethods, setAvailableMethods] = useState<string[]>([]);

    const login = useCallback(
        async (request: LoginCredentialsRequest): Promise<LoginCredentialsResult> => {
            setIsLoading(true);
            setError(null);
            setMfaRequired(false);
            try {
                const res = await client.api.loginWithCredentials(request);
                setResult(res);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                if (res.requiresMfa) {
                    setMfaRequired(true);
                    setMfaSessionId(res.mfaSessionId || null);
                    setAvailableMethods(res.availableMethods || []);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Login failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const verifyMfa = useCallback(
        async (request: MfaVerifyRequest): Promise<MfaVerifyResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.verifyMfa(request);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                if (res.success) {
                    setMfaRequired(false);
                    setMfaSessionId(null);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "MFA verification failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const reset = useCallback(() => {
        setError(null);
        setResult(null);
        setMfaRequired(false);
        setMfaSessionId(null);
        setAvailableMethods([]);
    }, []);

    return { login, verifyMfa, isLoading, error, result, mfaRequired, mfaSessionId, availableMethods, reset };
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export interface UseForgotPasswordResult {
    sendResetEmail: (request: ForgotPasswordRequest) => Promise<ForgotPasswordResult>;
    isLoading: boolean;
    success: boolean;
    error: string | null;
    reset: () => void;
}

/**
 * Hook for requesting password reset email
 */
export function useForgotPassword(): UseForgotPasswordResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendResetEmail = useCallback(
        async (request: ForgotPasswordRequest): Promise<ForgotPasswordResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.forgotPassword(request);
                setSuccess(res.success);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Request failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const reset = useCallback(() => {
        setSuccess(false);
        setError(null);
    }, []);

    return { sendResetEmail, isLoading, success, error, reset };
}

export interface UseResetPasswordResult {
    resetPassword: (request: ResetPasswordRequest) => Promise<ResetPasswordResult>;
    isLoading: boolean;
    success: boolean;
    error: string | null;
    reset: () => void;
}

/**
 * Hook for resetting password with token
 */
export function useResetPassword(): UseResetPasswordResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetPassword = useCallback(
        async (request: ResetPasswordRequest): Promise<ResetPasswordResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.resetPassword(request);
                setSuccess(res.success);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Reset failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const reset = useCallback(() => {
        setSuccess(false);
        setError(null);
    }, []);

    return { resetPassword, isLoading, success, error, reset };
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export interface UseChangePasswordResult {
    changePassword: (request: ChangePasswordRequest) => Promise<ChangePasswordResult>;
    isLoading: boolean;
    success: boolean;
    error: string | null;
    reset: () => void;
}

/**
 * Hook for changing password (authenticated user)
 */
export function useChangePassword(): UseChangePasswordResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const changePassword = useCallback(
        async (request: ChangePasswordRequest): Promise<ChangePasswordResult> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.changePassword(request);
                setSuccess(res.success);
                if (!res.success && res.error) {
                    setError(res.error);
                }
                return res;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Change failed";
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    const reset = useCallback(() => {
        setSuccess(false);
        setError(null);
    }, []);

    return { changePassword, isLoading, success, error, reset };
}

// ============================================================================
// SSO
// ============================================================================

export interface UseSsoProvidersResult {
    providers: SsoProvider[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching available SSO providers
 */
export function useSsoProviders(): UseSsoProvidersResult {
    const { client } = useIdPFlareContext();
    const [providers, setProviders] = useState<SsoProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.api.getSsoProviders();
            if (res.success) {
                setProviders(res.providers);
            } else {
                setError(res.error || "Failed to fetch providers");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch providers");
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    return { providers, isLoading, error, refetch: fetchProviders };
}

export interface UseStartSsoResult {
    startSso: (provider: SsoProvider, returnTo?: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook for starting SSO authentication flow
 * 
 * @example
 * ```tsx
 * function SsoButtons() {
 *   const { providers } = useSsoProviders();
 *   const { startSso, isLoading } = useStartSso();
 * 
 *   return (
 *     <div>
 *       {providers.map(provider => (
 *         <button key={provider} onClick={() => startSso(provider)} disabled={isLoading}>
 *           Sign in with {provider}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStartSso(): UseStartSsoResult {
    const { client } = useIdPFlareContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startSso = useCallback(
        async (provider: SsoProvider, returnTo?: string): Promise<void> => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await client.api.startSsoFlow({ provider, returnTo });
                if (res.success && res.authUrl) {
                    // Redirect to SSO provider
                    window.location.href = res.authUrl;
                } else {
                    setError(res.error || "Failed to start SSO");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to start SSO");
            } finally {
                setIsLoading(false);
            }
        },
        [client]
    );

    return { startSso, isLoading, error };
}
