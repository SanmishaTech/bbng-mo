# Authentication Fix Guide

## Problem Summary

All API calls were failing with **401 (Unauthorized)** errors because the application was using a **local admin bypass** that created fake authentication tokens. These fake tokens (`"admin_token_" + timestamp`) were being sent to the real API endpoints, which rejected them.

## Root Cause

**File:** `contexts/AuthContext.tsx` (Lines 205-249)
- Admin login created a local fake token instead of calling the API
- This fake token was stored in AsyncStorage
- All API services retrieved and sent this fake token with requests
- The backend API rejected the invalid token with 401 errors

## Changes Made

### 1. Removed Admin Bypass (`AuthContext.tsx`)
**Before:**
```typescript
if (email.toLowerCase() === "admin") {
  const adminToken = "admin_token_" + Date.now();
  // Stored fake token locally...
}
```

**After:**
```typescript
// Admin bypass removed - all logins now go through API authentication
// This ensures valid tokens are used for API requests
```

**Impact:** All users (including admins) now must authenticate through the real API to get valid tokens.

### 2. Enhanced Error Handling (`apiService.ts`)
**Added:**
- Automatic token cleanup on 401 errors
- Clear logging when authentication fails
- Removes invalid tokens from AsyncStorage

```typescript
if (response.status === 401) {
  console.warn('ApiService: 401 Unauthorized - clearing invalid token');
  await AsyncStorage.removeItem('auth_token').catch(() => {});
}
```

### 3. User-Friendly Auth Error Messages (`Dashboard.tsx`, `performance.tsx`)
**Added:**
- Detects 401 authentication errors
- Shows "Session Expired" alert
- Automatically signs user out and redirects to login

```typescript
if (error?.status === 401) {
  Alert.alert(
    "Session Expired",
    "Your session has expired. Please log in again.",
    [{ text: "OK", onPress: () => signOut() }]
  );
}
```

### 4. Performance Context Error Handling (`PerformanceContext.tsx`)
**Added:**
- Distinguishes between 401 (auth required) and 404 (feature unavailable)
- Better logging for debugging
- Appropriate error messages for each case

## What You Need to Do Now

### Step 1: Clear Existing Session Data

The app may still have the fake admin token stored. You need to clear it:

**Option A - Through the App:**
1. If you can access the app, tap the sign-out button
2. This will clear all stored authentication data

**Option B - Manual Clear (Development):**
Run this command to clear React Native AsyncStorage:
```bash
# For Android
adb shell run-as com.yourapp rm -rf /data/data/com.yourapp/databases

# For iOS Simulator
xcrun simctl get_app_container booted com.yourapp data
# Then manually delete the AsyncStorage folder
```

**Option C - Reinstall the App (Easiest):**
```bash
# Uninstall and reinstall to clear all data
npm run android  # or npm run ios
```

### Step 2: Use Valid API Credentials

You now need to log in with **real credentials** that the backend API recognizes:

1. Make sure your backend API is running and accessible
2. Use valid username/password that exists in the database
3. The API must return a proper token in the login response

### Step 3: Verify API Endpoints

Ensure these endpoints are working on your backend:

- `POST /api/auth/login` - Returns valid JWT token
- `GET /api/statistics/*` - All dashboard statistics endpoints
- `GET /api/performance-dashboard/*` - Performance dashboard endpoints

### Step 4: Test the Flow

1. **Restart the app** with cleared data
2. **Log in** with valid API credentials
3. **Verify** the dashboard loads without 401 errors
4. **Check** the performance dashboard works correctly

## API Token Requirements

Your backend API must return tokens in this format:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "role": "member",
      ...
    },
    "token": "valid.jwt.token.here",
    "refreshToken": "refresh.token.here" // optional
  }
}
```

## Debugging

If you still see 401 errors after these changes:

1. **Check the console logs:**
   - Look for "ApiService: 401 Unauthorized - clearing invalid token"
   - Check if token is being sent with requests

2. **Verify backend API:**
   ```bash
   # Test login endpoint directly
   curl -X POST http://your-api/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

3. **Check token format:**
   - Ensure backend returns JWT tokens
   - Verify token expiration is set correctly
   - Check token includes necessary claims

4. **Review network tab:**
   - Open browser developer tools
   - Check if Authorization header is being sent
   - Verify token format: `Bearer <token>`

## Rolling Back (If Needed)

If you need to temporarily restore the admin bypass for development:

1. Open `contexts/AuthContext.tsx`
2. Uncomment lines 157-202 (the old admin bypass code)
3. Comment out the API authentication call

**Warning:** This will restore the 401 errors for API calls. Only use for UI testing without backend.

## Summary

✅ **Fixed:** Removed fake token generation  
✅ **Fixed:** Added automatic invalid token cleanup  
✅ **Fixed:** User-friendly auth error messages  
✅ **Fixed:** Proper error handling across all services  

**Next Action:** Clear app data and log in with valid API credentials.
