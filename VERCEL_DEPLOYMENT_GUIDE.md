# Vercel Deployment Guide - CORS Fix

## 🐛 The CORS Issue

When deploying to Vercel, you're getting:
```
Access to XMLHttpRequest at 'https://your-api.vercel.app/api/auth/login' 
from origin 'https://feature-flag-olrs.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ The Solution

**Key Rule:** Handle CORS in your Express app ONLY, not in `vercel.json`. Setting headers in both places causes conflicts.

### Changes Made:

#### 1. **server/vercel.json** - Removed CORS headers
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

#### 2. **server/src/config/config.ts** - Proper CORS configuration
- Allows your Vercel frontend: `https://feature-flag-olrs.vercel.app`
- Allows localhost for development
- Handles credentials properly

#### 3. **server/src/index.ts** - CORS middleware FIRST
- CORS middleware is applied BEFORE any other middleware
- This ensures preflight OPTIONS requests are handled correctly

## 📋 Deployment Checklist

### Backend (Server) Deployment:

1. **Set Environment Variables in Vercel Dashboard:**
   ```
   CLIENT_URL=https://feature-flag-olrs.vercel.app
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_ACCESS_EXPIRATION=7d
   JWT_REFRESH_EXPIRATION=7d
   NODE_ENV=production
   ```

2. **Deploy to Vercel:**
   ```bash
   cd server
   vercel --prod
   ```

3. **Get your backend URL** (e.g., `https://your-backend.vercel.app`)

### Frontend (Client) Deployment:

1. **Update Environment Variable in Vercel Dashboard:**
   ```
   VITE_API_BASE_URL=https://your-backend.vercel.app/api
   ```

2. **Deploy to Vercel:**
   ```bash
   cd client
   vercel --prod
   ```

## 🔍 Debugging CORS Issues

### Check Server Logs:
After deployment, check Vercel function logs to see CORS debug messages:
```
🌐 CORS Allowed Origins: [...]
✅ CORS: Allowing origin: https://feature-flag-olrs.vercel.app
```

### Test with curl:
```bash
curl -X OPTIONS https://your-backend.vercel.app/api/auth/login \
  -H "Origin: https://feature-flag-olrs.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

You should see:
```
< Access-Control-Allow-Origin: https://feature-flag-olrs.vercel.app
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
< Access-Control-Allow-Credentials: true
```

### Common Issues:

#### ❌ Issue: "Credentials mode is 'include' but Access-Control-Allow-Origin is '*'"
**Solution:** You cannot use `Access-Control-Allow-Origin: *` with `credentials: true`. Must specify exact origin.

#### ❌ Issue: CORS headers appear twice
**Solution:** Remove CORS headers from `vercel.json` - handle only in Express.

#### ❌ Issue: OPTIONS request returns 404
**Solution:** Ensure CORS middleware is applied BEFORE routes and handles OPTIONS.

## 🧪 Testing After Deployment

1. **Open your frontend:** `https://feature-flag-olrs.vercel.app`
2. **Open browser DevTools** (F12) → Network tab
3. **Try to login**
4. **Check the OPTIONS preflight request:**
   - Should return 200 or 204
   - Should have CORS headers
5. **Check the POST login request:**
   - Should succeed with 200
   - Should have CORS headers

## 📝 Environment Variables Summary

### Backend (server/.env or Vercel Dashboard):
```env
PORT=5001
MONGO_URI=mongodb://...
CLIENT_URL=https://feature-flag-olrs.vercel.app
JWT_SECRET=your_secret_here
JWT_ACCESS_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=production
```

### Frontend (client/.env.production or Vercel Dashboard):
```env
VITE_API_BASE_URL=https://your-backend.vercel.app/api
```

## 🚀 Quick Deploy Commands

```bash
# Deploy backend
cd server
vercel --prod

# Deploy frontend (after updating VITE_API_BASE_URL)
cd ../client
vercel --prod
```

## 🔧 If CORS Still Doesn't Work

1. **Clear browser cache** and try in incognito mode
2. **Check Vercel function logs** for CORS debug messages
3. **Verify environment variables** are set correctly in Vercel dashboard
4. **Ensure both deployments are using latest code:**
   ```bash
   git add .
   git commit -m "Fix CORS configuration"
   git push
   vercel --prod
   ```

## 📚 References

- [Vercel CORS Guide](https://vercel.com/guides/how-to-enable-cors)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)

---

**Status:** ✅ CORS configuration updated - ready for deployment
