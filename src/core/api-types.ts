/**
 * API Types for Direct Authentication
 * 
 * These types are used for building custom authentication UIs
 * that communicate directly with the IDPFlare API instead of
 * using the OAuth redirect flow.
 */

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Request to register a new user
 */
export interface RegisterRequest {
    /** User's email address */
    email: string;
    /** Password (must meet minimum length requirements) */
    password: string;
    /** Optional display name */
    name?: string;
    /** Optional first name */
    givenName?: string;
    /** Optional last name */
    familyName?: string;
}

/**
 * Result of a registration attempt
 */
export interface RegisterResult {
    success: boolean;
    /** User ID if registration succeeded */
    userId?: string;
    /** Error message if registration failed */
    error?: string;
    /** True if email verification is required before login */
    requiresVerification?: boolean;
    /** Human-readable message */
    message?: string;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Request to login with credentials
 */
export interface LoginCredentialsRequest {
    /** User's email address */
    email: string;
    /** User's password */
    password: string;
}

/**
 * Result of a login attempt
 */
export interface LoginCredentialsResult {
    success: boolean;
    /** Error message if login failed */
    error?: string;
    /** True if email verification is required */
    requiresVerification?: boolean;
    /** True if MFA setup is required before login */
    requiresMfaSetup?: boolean;
    /** True if MFA verification is needed to complete login */
    requiresMfa?: boolean;
    /** MFA session ID (needed for verifyMfa call) */
    mfaSessionId?: string;
    /** Available MFA methods the user has enabled */
    availableMethods?: string[];
    /** Masked email for display (e.g., "jo***@example.com") */
    maskedEmail?: string;
    /** Session ID if login succeeded (no MFA) */
    sessionId?: string;
    /** User ID if login succeeded */
    userId?: string;
    /** Session expiration timestamp (ms since epoch) */
    expiresAt?: number;
}

// ============================================================================
// MFA
// ============================================================================

/**
 * Request to verify MFA code
 */
export interface MfaVerifyRequest {
    /** MFA session ID from login response */
    mfaSessionId: string;
    /** The verification code entered by user */
    code: string;
    /** MFA method being used */
    method?: "totp" | "email" | "backup_codes";
}

/**
 * Result of MFA verification
 */
export interface MfaVerifyResult {
    success: boolean;
    /** Error message if verification failed */
    error?: string;
    /** Session ID if verification succeeded */
    sessionId?: string;
    /** User ID if verification succeeded */
    userId?: string;
    /** Session expiration timestamp (ms since epoch) */
    expiresAt?: number;
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request to send password reset email
 */
export interface ForgotPasswordRequest {
    /** User's email address */
    email: string;
}

/**
 * Result of forgot password request
 */
export interface ForgotPasswordResult {
    success: boolean;
    /** Human-readable message */
    message?: string;
    /** Error message if request failed */
    error?: string;
}

/**
 * Request to reset password with token
 */
export interface ResetPasswordRequest {
    /** Reset token from email link */
    token: string;
    /** New password */
    password: string;
}

/**
 * Result of password reset
 */
export interface ResetPasswordResult {
    success: boolean;
    /** Human-readable message */
    message?: string;
    /** Error message if reset failed */
    error?: string;
}

// ============================================================================
// PASSWORD CHANGE
// ============================================================================

/**
 * Request to change password (authenticated user)
 */
export interface ChangePasswordRequest {
    /** User's current password */
    currentPassword: string;
    /** New password */
    newPassword: string;
}

/**
 * Result of password change
 */
export interface ChangePasswordResult {
    success: boolean;
    /** Human-readable message */
    message?: string;
    /** Error message if change failed */
    error?: string;
}

// ============================================================================
// SSO
// ============================================================================

/**
 * Supported SSO providers
 */
export type SsoProvider = "google" | "github" | "microsoft" | "facebook";

/**
 * Result of fetching SSO providers
 */
export interface SsoProvidersResult {
    success: boolean;
    /** List of enabled SSO providers */
    providers: SsoProvider[];
    /** Whether new user registration is allowed */
    registrationEnabled?: boolean;
    /** Error message if request failed */
    error?: string;
}

/**
 * Request to start SSO flow
 */
export interface SsoStartRequest {
    /** SSO provider to use */
    provider: SsoProvider;
    /** Optional URL to redirect to after SSO completes */
    returnTo?: string;
}

/**
 * Result of starting SSO flow
 */
export interface SsoStartResult {
    success: boolean;
    /** URL to redirect user to for SSO authentication */
    authUrl?: string;
    /** State parameter for CSRF protection */
    state?: string;
    /** Error message if request failed */
    error?: string;
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Request to resend verification email
 */
export interface ResendVerificationRequest {
    /** User's email address */
    email: string;
}

/**
 * Result of resend verification request
 */
export interface ResendVerificationResult {
    success: boolean;
    /** Human-readable message */
    message?: string;
    /** Error message if request failed */
    error?: string;
}
