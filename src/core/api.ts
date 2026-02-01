/**
 * IDPFlare API Client
 * 
 * Direct API methods for building custom authentication UIs.
 * Use this instead of the OAuth redirect flow when you want
 * to build your own login, registration, and password reset pages.
 * 
 * @example
 * ```typescript
 * import { createIdPFlareClient } from '@idpflare/client';
 * 
 * const client = createIdPFlareClient({
 *   authority: 'https://auth.example.com',
 *   clientId: 'my-app',
 *   redirectUri: 'https://myapp.com/callback',
 * });
 * 
 * // Register a new user
 * const result = await client.api.register({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   name: 'John Doe',
 * });
 * 
 * // Login with credentials
 * const loginResult = await client.api.loginWithCredentials({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 * });
 * 
 * if (loginResult.requiresMfa) {
 *   // Handle MFA verification
 *   const mfaResult = await client.api.verifyMfa({
 *     mfaSessionId: loginResult.mfaSessionId!,
 *     code: '123456',
 *     method: 'totp',
 *   });
 * }
 * ```
 */

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
    SsoStartResult,
    ResendVerificationRequest,
    ResendVerificationResult,
} from "./api-types";

/**
 * IDPFlare API client for direct authentication
 */
export class IdPFlareApi {
    private authority: string;

    constructor(authority: string) {
        this.authority = authority.replace(/\/$/, ""); // Remove trailing slash
    }

    /**
     * Helper to make API requests
     */
    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.authority}/api/v1${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        return response.json() as Promise<T>;
    }

    // ==========================================================================
    // REGISTRATION
    // ==========================================================================

    /**
     * Register a new user with email and password
     * 
     * @param request - Registration request with email, password, and optional name fields
     * @returns Registration result indicating success or error
     * 
     * @example
     * ```typescript
     * const result = await client.api.register({
     *   email: 'user@example.com',
     *   password: 'securePassword123',
     *   givenName: 'John',
     *   familyName: 'Doe',
     * });
     * 
     * if (result.success) {
     *   if (result.requiresVerification) {
     *     // Show "check your email" message
     *   } else {
     *     // User can login immediately
     *   }
     * } else {
     *   // Show error: result.error
     * }
     * ```
     */
    async register(request: RegisterRequest): Promise<RegisterResult> {
        return this.request<RegisterResult>("/auth/register", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    // ==========================================================================
    // LOGIN
    // ==========================================================================

    /**
     * Login with email and password credentials
     * 
     * This may return a session directly, or indicate that MFA is required.
     * If MFA is required, use the mfaSessionId to call verifyMfa().
     * 
     * @param request - Login request with email and password
     * @returns Login result with session or MFA challenge
     * 
     * @example
     * ```typescript
     * const result = await client.api.loginWithCredentials({
     *   email: 'user@example.com',
     *   password: 'securePassword123',
     * });
     * 
     * if (result.success) {
     *   if (result.requiresMfa) {
     *     // Show MFA verification form
     *     // Available methods: result.availableMethods
     *     // Use result.mfaSessionId for verifyMfa call
     *   } else {
     *     // Login complete! Session ID: result.sessionId
     *   }
     * } else {
     *   // Show error: result.error
     * }
     * ```
     */
    async loginWithCredentials(
        request: LoginCredentialsRequest
    ): Promise<LoginCredentialsResult> {
        return this.request<LoginCredentialsResult>("/auth/login", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    /**
     * Verify MFA code to complete login
     * 
     * Call this after loginWithCredentials() returns requiresMfa: true
     * 
     * @param request - MFA verification request with session ID, code, and method
     * @returns Verification result with session if successful
     * 
     * @example
     * ```typescript
     * const result = await client.api.verifyMfa({
     *   mfaSessionId: loginResult.mfaSessionId!,
     *   code: '123456',
     *   method: 'totp', // or 'email', 'backup_codes'
     * });
     * 
     * if (result.success) {
     *   // Login complete! Session ID: result.sessionId
     * }
     * ```
     */
    async verifyMfa(request: MfaVerifyRequest): Promise<MfaVerifyResult> {
        return this.request<MfaVerifyResult>("/auth/mfa/verify", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    /**
     * Request an email MFA code to be sent
     * 
     * Call this when the user wants to use email MFA and needs a new code.
     * The mfaSessionId from loginWithCredentials() is required.
     * 
     * @param mfaSessionId - MFA session ID from login response
     */
    async requestEmailMfaCode(mfaSessionId: string): Promise<{ success: boolean; error?: string }> {
        return this.request("/auth/mfa/send-email", {
            method: "POST",
            body: JSON.stringify({ mfaSessionId }),
        });
    }

    // ==========================================================================
    // PASSWORD RESET
    // ==========================================================================

    /**
     * Request a password reset email
     * 
     * For security, this always returns success even if the email doesn't exist.
     * 
     * @param request - Request with user's email address
     * @returns Result with success message
     * 
     * @example
     * ```typescript
     * const result = await client.api.forgotPassword({
     *   email: 'user@example.com',
     * });
     * // Always show: "If an account exists, a reset link has been sent."
     * ```
     */
    async forgotPassword(
        request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResult> {
        return this.request<ForgotPasswordResult>("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    /**
     * Reset password using a token from the reset email
     * 
     * @param request - Request with reset token and new password
     * @returns Result indicating success or error
     * 
     * @example
     * ```typescript
     * // Extract token from URL: /reset-password?token=abc123
     * const token = new URLSearchParams(window.location.search).get('token');
     * 
     * const result = await client.api.resetPassword({
     *   token: token!,
     *   password: 'newSecurePassword123',
     * });
     * 
     * if (result.success) {
     *   // Redirect to login page
     * }
     * ```
     */
    async resetPassword(
        request: ResetPasswordRequest
    ): Promise<ResetPasswordResult> {
        return this.request<ResetPasswordResult>("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    // ==========================================================================
    // PASSWORD CHANGE
    // ==========================================================================

    /**
     * Change password for an authenticated user
     * 
     * Requires the user to be logged in (session cookie or Bearer token).
     * 
     * @param request - Request with current and new password
     * @param sessionId - Optional session ID to send as Bearer token
     * @returns Result indicating success or error
     * 
     * @example
     * ```typescript
     * const result = await client.api.changePassword({
     *   currentPassword: 'oldPassword123',
     *   newPassword: 'newSecurePassword456',
     * }, sessionId);
     * 
     * if (result.success) {
     *   // Show success message
     * }
     * ```
     */
    async changePassword(
        request: ChangePasswordRequest,
        sessionId?: string
    ): Promise<ChangePasswordResult> {
        const headers: Record<string, string> = {};
        if (sessionId) {
            headers["Authorization"] = `Bearer ${sessionId}`;
        }

        return this.request<ChangePasswordResult>("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(request),
            headers,
            credentials: "include", // Include cookies
        });
    }

    // ==========================================================================
    // SSO
    // ==========================================================================

    /**
     * Get list of enabled SSO providers
     * 
     * @returns List of enabled providers (google, github, microsoft, facebook)
     * 
     * @example
     * ```typescript
     * const result = await client.api.getSsoProviders();
     * 
     * // Render SSO buttons for each provider
     * result.providers.forEach(provider => {
     *   // Show button for provider
     * });
     * ```
     */
    async getSsoProviders(): Promise<SsoProvidersResult> {
        return this.request<SsoProvidersResult>("/auth/sso/providers", {
            method: "GET",
        });
    }

    /**
     * Start SSO authentication flow
     * 
     * This returns a URL to redirect the user to for SSO authentication.
     * SSO handles both login and registration automatically - if the user
     * doesn't exist, they'll be registered with their SSO profile.
     * 
     * @param request - Request with provider and optional returnTo URL
     * @returns Result with authUrl to redirect to
     * 
     * @example
     * ```typescript
     * const result = await client.api.startSsoFlow({
     *   provider: 'google',
     *   returnTo: '/dashboard',
     * });
     * 
     * if (result.success) {
     *   // Redirect user to SSO provider
     *   window.location.href = result.authUrl!;
     * }
     * ```
     */
    async startSsoFlow(request: SsoStartRequest): Promise<SsoStartResult> {
        return this.request<SsoStartResult>(`/auth/sso/${request.provider}/start`, {
            method: "POST",
            body: JSON.stringify({ returnTo: request.returnTo }),
        });
    }

    // ==========================================================================
    // EMAIL VERIFICATION
    // ==========================================================================

    /**
     * Resend email verification link
     * 
     * For security, this always returns success even if the email doesn't exist
     * or is already verified.
     * 
     * @param request - Request with user's email address
     * @returns Result with success message
     */
    async resendVerification(
        request: ResendVerificationRequest
    ): Promise<ResendVerificationResult> {
        return this.request<ResendVerificationResult>("/auth/resend-verification", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }
}

/**
 * Create a new IDPFlare API client instance
 * 
 * @param authority - Base URL of the IDPFlare instance
 */
export function createIdPFlareApi(authority: string): IdPFlareApi {
    return new IdPFlareApi(authority);
}
