# Troubleshooting Support Service

## Common Issues and Solutions

### 1. "Invalid or expired token" Error (403)

**Symptoms:**
- Login succeeds but subsequent API calls fail with 403
- Error message: `{"status":403,"message":"Invalid or expired token","data":null}`

**Causes & Solutions:**

#### A. Missing JWT Secret
**Problem:** No JWT secret configured in environment variables.

**Solution:**
1. Create/edit `.env` file in `Backend/services/support-service/`
2. Add at least one of these:
   ```env
   ADMIN_ACCESS_TOKEN_SECRET=your_secret_key_here
   ```
   OR
   ```env
   AGENT_ACCESS_TOKEN_SECRET=your_secret_key_here
   ```
   OR
   ```env
   ACCESS_TOKEN_SECRET=your_secret_key_here
   ```
3. Restart the service

#### B. Secret Mismatch
**Problem:** Token signed with one secret, verified with another.

**Solution:**
- Ensure the same secret is used for both signing (login) and verification (middleware)
- Check server logs for "JWT verification error" to see the exact issue
- Verify `.env` file is being loaded correctly

#### C. Token Format Issues
**Problem:** Token structure doesn't match what middleware expects.

**Debug Steps:**
1. Check browser console for the actual token
2. Verify token includes `role: 'agent'` or `role: 'admin'`
3. Check token expiration time

### 2. Quick Fix: Use Existing Admin Secret

If you already have an `ADMIN_ACCESS_TOKEN_SECRET` configured elsewhere:

1. Find where it's defined (check other service `.env` files)
2. Add to `Backend/services/support-service/.env`:
   ```env
   ADMIN_ACCESS_TOKEN_SECRET=your_existing_admin_secret
   ```
3. Restart support service

### 3. Environment File Not Loading

**Check:**
1. `.env` file exists in `Backend/services/support-service/`
2. Service is restarted after adding env variables
3. No syntax errors in `.env` file

**Test:**
Add this to `index.js` temporarily to verify:
```javascript
console.log('JWT Secret exists:', !!process.env.ADMIN_ACCESS_TOKEN_SECRET);
```

### 4. Token Generation vs Verification Mismatch

**Verify both use same secret:**

**Login (token generation):** `Backend/services/support-service/controllers/agentController.js`
- Uses: `AGENT_ACCESS_TOKEN_SECRET || ADMIN_ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET`

**Verification (middleware):** `Backend/services/support-service/middleware/auth.js`
- Uses: `AGENT_ACCESS_TOKEN_SECRET || ADMIN_ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET`

Both should match! If they don't, tokens will fail verification.

### 5. Testing Token Manually

**Decode token** (check structure):
```javascript
// In browser console after login:
const token = localStorage.getItem('agentToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// Should show: { id, email, fullname, role: 'agent', type: 'agent', ... }
```

## Quick Setup Checklist

- [ ] `.env` file created in `Backend/services/support-service/`
- [ ] At least one JWT secret set: `ADMIN_ACCESS_TOKEN_SECRET` or `AGENT_ACCESS_TOKEN_SECRET`
- [ ] `MONGO_URI` configured correctly
- [ ] Service restarted after adding env variables
- [ ] Agent account created using seeder
- [ ] Login successful (check browser console for token)
- [ ] Token stored in `localStorage` as `agentToken`

## Still Having Issues?

1. Check server logs when making the failing request
2. Look for "JWT verification error" messages
3. Verify token in browser: `localStorage.getItem('agentToken')`
4. Compare token payload with what middleware expects

