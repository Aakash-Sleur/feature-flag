# Logout Implementation - Server-Side Token Cleanup

## 🔐 Overview

The logout functionality now properly clears both refresh tokens and access tokens on the server side, preventing token reuse after logout.

## ✅ What Was Fixed

### Before:
- ❌ Logout only revoked refresh token from database
- ❌ Access token remained in user document
- ❌ Old access token could still be used until expiration
- ❌ No user tracking in logout

### After:
- ✅ Logout revokes refresh token from database
- ✅ Logout clears access token from user document
- ✅ Old access token becomes invalid immediately
- ✅ Logout works with or without authentication
- ✅ Proper logging for audit trail

## 📝 Implementation Details

### 1. **Controller** (`server/src/controllers/auth.controller.ts`)

```typescript
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const userId = req.user?._id; // From optionalAuth middleware

    // Revoke refresh token and clear access token
    await logoutUser(refreshToken, userId);

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info('User logged out successfully', { 
      userId: userId || 'unknown',
      hadRefreshToken: !!refreshToken 
    });

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: "LOGOUT_ERROR",
    });
  }
};
```

### 2. **Service** (`server/src/services/auth.service.ts`)

```typescript
export const logout = async (refreshToken?: string, userId?: string): Promise<void> => {
  try {
    // Revoke refresh token if provided
    if (refreshToken) {
      await revokeRefreshTokenUtil(refreshToken);
      logger.debug('Refresh token revoked', { hasToken: !!refreshToken });
    }

    // Clear access token from user document if userId provided
    if (userId) {
      await User.findByIdAndUpdate(userId, { 
        access_token: null 
      });
      logger.debug('Access token cleared from user document', { userId });
    }

    logger.info('Logout completed', { 
      revokedRefreshToken: !!refreshToken,
      clearedAccessToken: !!userId 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};
```

### 3. **Routes** (`server/src/routes/auth.routes.ts`)

```typescript
// Logout with optional authentication (clears access token if authenticated)
router.post("/logout", optionalAuth, logout);
```

The `optionalAuth` middleware:
- Tries to authenticate the user if a token is present
- Doesn't fail if no token or invalid token
- Populates `req.user` if authentication succeeds
- Allows logout to work in both scenarios

## 🔄 Logout Flow

### Scenario 1: Authenticated Logout (Recommended)
```
1. Client sends logout request with Authorization header
2. optionalAuth middleware validates token and sets req.user
3. Controller gets userId from req.user
4. Service revokes refresh token from database
5. Service clears access_token from user document
6. Controller clears refresh token cookie
7. Response: 200 OK
```

### Scenario 2: Unauthenticated Logout (Fallback)
```
1. Client sends logout request without valid token
2. optionalAuth middleware doesn't set req.user
3. Controller gets userId as undefined
4. Service revokes refresh token from database (if provided)
5. Service skips clearing access_token (no userId)
6. Controller clears refresh token cookie
7. Response: 200 OK
```

## 🛡️ Security Benefits

1. **Immediate Token Invalidation**
   - Access token is cleared from database
   - JWT middleware checks token against database
   - Old token fails validation immediately

2. **Refresh Token Revocation**
   - Refresh token deleted from database
   - Cannot be used to generate new access tokens

3. **Cookie Cleanup**
   - HTTP-only cookie cleared from browser
   - Prevents automatic token reuse

4. **Audit Trail**
   - All logout attempts logged
   - User ID tracked when available
   - Helps with security monitoring

## 🧪 Testing

### Test 1: Authenticated Logout
```bash
# Login first
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Extract access token from response
ACCESS_TOKEN="<token_from_login_response>"

# Logout with token
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -v

# Try to use old token (should fail)
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Expected: 401 Unauthorized - "Token revoked or invalid"
```

### Test 2: Unauthenticated Logout
```bash
# Logout without token (still works)
curl -X POST http://localhost:5001/api/auth/logout \
  -b cookies.txt \
  -v

# Expected: 200 OK - "Logout successful"
```

### Test 3: Client-Side Logout
```typescript
// In your React app
const handleLogout = async () => {
  try {
    // Call logout endpoint (sends token automatically)
    await authAPI.logout();
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    
    // Redirect to login
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## 📊 Database Changes

### User Document After Logout:
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "John Doe",
  password_hash: "$2b$12$...",
  role: "ORG_ADMIN",
  access_token: null,  // ✅ Cleared on logout
  // ... other fields
}
```

### RefreshToken Collection After Logout:
```javascript
// Token document is deleted
// No refresh tokens exist for this user
```

## 🔧 Additional Features

### Logout from All Devices

Already implemented in `server/src/utils/jwt.ts`:

```typescript
export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ user_id: userId });
  await User.findByIdAndUpdate(userId, { access_token: null });
};
```

To use this, create a new endpoint:

```typescript
// In auth.controller.ts
export const logoutAllDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    await revokeAllRefreshTokens(req.user._id);

    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    logger.error("Logout all devices error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout from all devices",
    });
  }
};

// In auth.routes.ts
router.post("/logout/all", authenticateToken, logoutAllDevices);
```

## 📝 Client-Side Implementation

Make sure your client properly calls logout:

```typescript
// client/src/services/auth.service.ts
export const authAPI = {
  async logout(): Promise<void> {
    // This will send the Authorization header automatically
    await apiClient.post("/auth/logout");
  }
};
```

## ✅ Checklist

- [x] Logout revokes refresh token from database
- [x] Logout clears access token from user document
- [x] Logout clears refresh token cookie
- [x] Logout works with optional authentication
- [x] Proper error handling and logging
- [x] Client-side localStorage cleanup
- [x] Token validation checks database
- [x] Logout from all devices utility available

---

**Status:** ✅ **COMPLETE**

Logout now properly invalidates all tokens on the server side, preventing token reuse after logout.
