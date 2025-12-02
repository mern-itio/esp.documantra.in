# Quick Fix: "Invalid or expired token" Error

## Problem
After agent login, getting: `{"status":403,"message":"Invalid or expired token","data":null}`

## Solution (3 Steps)

### Step 1: Create .env file
Create this file: `Backend/services/support-service/.env`

```env
PORT=2107
MONGO_URI=mongodb://localhost:27017/draftsign
ADMIN_ACCESS_TOKEN_SECRET=your_admin_secret_here
CORS_ORIGIN=http://localhost:5173
```

### Step 2: Find your existing admin secret
Check if you have `ADMIN_ACCESS_TOKEN_SECRET` set in:
- `Backend/services/auth-service/.env`
- `Backend/.env`
- Or any other service `.env` file

If found, use the same value in support-service `.env`.

If not found, generate a new secret:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Restart service
```bash
cd Backend/services/support-service
# Stop the service (Ctrl+C)
# Start again
npm run dev
```

## Verify Configuration

Run the config checker:
```bash
npm run check:config
```

Should show: `✅ Configuration looks good!`

## Test Again

1. Login at: `http://localhost:5173/support/login`
2. Should work now!

## Still Not Working?

Check server logs for:
- "JWT Secret missing!" → Secret not set in .env
- "JWT verification error" → Secret mismatch
- "Token role mismatch" → Token doesn't have agent role

See `Backend/services/support-service/TROUBLESHOOTING.md` for detailed help.

