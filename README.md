# @idpflare/client

OAuth 2.0 / OpenID Connect client library for IDPFlare. Provides a simple, MSAL-like API for authenticating users with your IDPFlare identity provider.

## Features

- 🔐 **OAuth 2.0 Authorization Code + PKCE** - Secure authentication for SPAs
- 🎣 **React Hooks** - First-class React integration with hooks and context
- 📦 **TypeScript** - Full type definitions included
- 🔄 **Automatic Token Refresh** - Seamlessly refreshes tokens before expiry
- 💾 **Flexible Storage** - localStorage, sessionStorage, or in-memory
- 🎯 **Event System** - Subscribe to authentication events
- 🚀 **Zero Dependencies** - Core library has no runtime dependencies

## Installation

```bash
npm install @idpflare/client
```

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { createIdPFlareClient } from '@idpflare/client';

const client = createIdPFlareClient({
  authority: 'https://auth.example.com',
  clientId: 'my-spa-app',
  redirectUri: 'https://myapp.com/callback',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
});

// Start login
document.getElementById('loginBtn').onclick = () => client.login();

// Handle callback (on your /callback page)
if (window.location.search.includes('code=')) {
  const result = await client.handleCallback();
  if (result.success) {
    window.location.href = '/dashboard';
  }
}

// Check if authenticated
if (client.isAuthenticated()) {
  const userInfo = await client.getUserInfo();
  console.log('Logged in as:', userInfo.email);
}

// Make authenticated API calls
const response = await client.fetch('/api/protected-resource');

// Logout
document.getElementById('logoutBtn').onclick = () => client.logout();
```

### React

```tsx
import { IdPFlareProvider, useIdPFlare, useAuth, useUserInfo } from '@idpflare/client/react';

// Wrap your app with the provider
function App() {
  return (
    <IdPFlareProvider
      config={{
        authority: 'https://auth.example.com',
        clientId: 'my-spa-app',
        redirectUri: window.location.origin + '/callback',
      }}
      onLoginSuccess={(account) => console.log('Logged in:', account.email)}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </IdPFlareProvider>
  );
}

// Use hooks in your components
function HomePage() {
  const { login, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <a href="/dashboard">Go to Dashboard</a>
      ) : (
        <button onClick={() => login()}>Sign In</button>
      )}
    </div>
  );
}

function DashboardPage() {
  const { logout, account } = useIdPFlare();
  const { userInfo, loading } = useUserInfo();

  if (loading) return <div>Loading user info...</div>;

  return (
    <div>
      <h1>Welcome, {userInfo?.name || account?.email}</h1>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}

// Callback page (usually handled automatically by provider)
function CallbackPage() {
  const { isLoading, error } = useIdPFlare();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !error) {
      navigate('/dashboard');
    }
  }, [isLoading, error, navigate]);

  if (error) return <div>Error: {error}</div>;
  return <div>Completing login...</div>;
}
```

## Configuration

```typescript
interface IdPFlareConfig {
  // Required
  authority: string;      // IDPFlare base URL (e.g., 'https://auth.example.com')
  clientId: string;       // Your OAuth client ID
  redirectUri: string;    // OAuth callback URL

  // Optional
  postLogoutRedirectUri?: string;  // Where to redirect after logout
  scopes?: string[];               // OAuth scopes (default: ['openid', 'profile', 'email'])
  autoRefresh?: boolean;           // Auto-refresh tokens (default: true)
  refreshBuffer?: number;          // Seconds before expiry to refresh (default: 60)
  storage?: 'localStorage' | 'sessionStorage' | 'memory';  // Token storage (default: 'localStorage')
  storageKeyPrefix?: string;       // Storage key prefix (default: 'idpflare')
}
```

## API Reference

### IdPFlareClient

#### Authentication Methods

| Method | Description |
|--------|-------------|
| `login(request?)` | Start the login flow (redirects to IdP) |
| `handleCallback(url?)` | Handle the OAuth callback |
| `logout(options?)` | Log out the user |
| `isAuthenticated()` | Check if user is authenticated |

#### Token Methods

| Method | Description |
|--------|-------------|
| `getAccessToken()` | Get current access token (null if expired) |
| `getAccessTokenSilent()` | Get token, refreshing if needed |
| `getTokens()` | Get all stored tokens |
| `refreshAccessToken()` | Manually refresh the access token |
| `revokeToken()` | Revoke the current access token |

#### User Info Methods

| Method | Description |
|--------|-------------|
| `getAccount()` | Get current account info |
| `getUserInfo()` | Fetch user info from userinfo endpoint |
| `getIdTokenClaims()` | Parse and return ID token claims |

#### Utility Methods

| Method | Description |
|--------|-------------|
| `fetch(input, init?)` | Make authenticated fetch request |
| `getAuthorizationHeader()` | Get `Bearer <token>` header value |
| `getDiscoveryDocument()` | Fetch OIDC discovery document |

#### Events

```typescript
client.on('loginStart', (event) => { /* ... */ });
client.on('loginSuccess', (event) => { /* ... */ });
client.on('loginError', (event) => { /* ... */ });
client.on('logoutStart', (event) => { /* ... */ });
client.on('logoutComplete', (event) => { /* ... */ });
client.on('tokenRefresh', (event) => { /* ... */ });
client.on('tokenRefreshError', (event) => { /* ... */ });
client.on('sessionExpired', (event) => { /* ... */ });
```

### React Hooks

| Hook | Description |
|------|-------------|
| `useIdPFlare()` | Full context with state and actions |
| `useAuth()` | Login, logout, and auth state |
| `useIsAuthenticated()` | Just `isLoading` and `isAuthenticated` |
| `useAccount()` | Current account info |
| `useUserInfo()` | Fetch and cache user info |
| `useIdTokenClaims()` | Parsed ID token claims |
| `useTokens()` | All stored tokens |
| `useAccessToken()` | Get token function (with auto-refresh) |
| `useAuthenticatedFetch()` | Fetch function with auth headers |
| `useRequireAuth(options?)` | Redirect to login if not authenticated |

### API Hooks (for Custom UIs)

| Hook | Description |
|------|-------------|
| `useRegister()` | Register new users |
| `useLoginWithCredentials()` | Login with email/password + MFA |
| `useForgotPassword()` | Request password reset email |
| `useResetPassword()` | Reset password with token |
| `useChangePassword()` | Change password (authenticated) |
| `useSsoProviders()` | Get enabled SSO providers |
| `useStartSso()` | Start SSO authentication flow |

## Custom UI API

Build your own login, registration, and password reset pages using the direct API:

### Registration

```typescript
// Vanilla JS
const result = await client.api.register({
  email: 'user@example.com',
  password: 'securePassword123',
  givenName: 'John',
  familyName: 'Doe',
});

if (result.requiresVerification) {
  // Show "check your email" message
}

// React
const { register, isLoading, error, result } = useRegister();
await register({ email, password, name });
```

### Login with Credentials

```typescript
// Vanilla JS
const result = await client.api.loginWithCredentials({
  email: 'user@example.com',
  password: 'password',
});

if (result.requiresMfa) {
  // Show MFA verification form
  const mfaResult = await client.api.verifyMfa({
    mfaSessionId: result.mfaSessionId,
    code: '123456',
    method: 'totp', // or 'email', 'backup_codes'
  });
}

// React
const { login, verifyMfa, mfaRequired, availableMethods } = useLoginWithCredentials();
await login({ email, password });
if (mfaRequired) {
  await verifyMfa({ mfaSessionId, code, method: 'totp' });
}
```

### Password Reset

```typescript
// Request reset email
await client.api.forgotPassword({ email: 'user@example.com' });

// Reset with token (from email link)
await client.api.resetPassword({
  token: urlParams.get('token'),
  password: 'newPassword123',
});
```

### SSO (Social Login)

```tsx
// React - show SSO buttons
function SsoButtons() {
  const { providers } = useSsoProviders();
  const { startSso, isLoading } = useStartSso();

  return (
    <div>
      {providers.map(provider => (
        <button key={provider} onClick={() => startSso(provider)}>
          Sign in with {provider}
        </button>
      ))}
    </div>
  );
}

// Vanilla JS
const { providers } = await client.api.getSsoProviders();
const { authUrl } = await client.api.startSsoFlow({ provider: 'google' });
window.location.href = authUrl; // Redirect to Google
```

## Login Options

```typescript
await client.login({
  // Additional scopes to request
  scopes: ['custom:scope'],

  // Force re-authentication
  prompt: 'login',

  // Hint for which account to use
  loginHint: 'user@example.com',

  // Custom state parameter
  state: 'custom-state',

  // Extra query parameters
  extraQueryParams: {
    custom_param: 'value',
  },
});
```

## Protected Routes (React)

```tsx
function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null; // Will redirect to login

  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

## Making API Calls

```typescript
// Using the client directly
const response = await client.fetch('/api/resource');

// Or get the token manually
const token = await client.getAccessTokenSilent();
const response = await fetch('/api/resource', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### With React

```tsx
function MyComponent() {
  const authFetch = useAuthenticatedFetch();

  const loadData = async () => {
    const response = await authFetch('/api/resource');
    const data = await response.json();
    // ...
  };
}
```

## Silent Token Refresh

Tokens are automatically refreshed when using `getAccessTokenSilent()` or the `fetch()` helper. You can also manually refresh:

```typescript
const refreshed = await client.refreshAccessToken();
if (!refreshed) {
  // Refresh failed, user needs to log in again
  client.login();
}
```

## Event Handling

```typescript
// Subscribe to events
const unsubscribe = client.on('sessionExpired', () => {
  showNotification('Your session has expired. Please log in again.');
  client.login();
});

// Later: unsubscribe
unsubscribe();
```

## Storage Options

```typescript
// localStorage (default) - persists across tabs and browser restarts
createIdPFlareClient({ storage: 'localStorage', ... });

// sessionStorage - cleared when tab closes
createIdPFlareClient({ storage: 'sessionStorage', ... });

// Memory - cleared on page refresh (useful for high-security scenarios)
createIdPFlareClient({ storage: 'memory', ... });
```

## TypeScript

Full TypeScript support is included:

```typescript
import type {
  IdPFlareConfig,
  UserInfo,
  IdTokenClaims,
  AuthenticationResult,
  AccountInfo,
} from '@idpflare/client';
```

## Browser Support

- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Requires Web Crypto API (for PKCE)

## License

Polyform Strict License 1.0.0

