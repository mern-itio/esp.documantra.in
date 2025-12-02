# Support Service Environment Variables Setup

## Required Environment Variables

Create a `.env` file in `Backend/services/support-service/` with the following variables:

```env
# Server Configuration
PORT=2107
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/draftsign

# JWT Secrets (IMPORTANT: At least one must be set)
# Option 1: Use separate secret for agents
AGENT_ACCESS_TOKEN_SECRET=your_super_secret_agent_key_here

# Option 2: Use admin secret (recommended if you already have it)
ADMIN_ACCESS_TOKEN_SECRET=your_admin_secret_key_here

# Option 3: Use user access token secret as fallback
ACCESS_TOKEN_SECRET=your_user_access_token_secret

# Token Expiry
AGENT_ACCESS_TOKEN_EXPIRY=8h

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Quick Setup

### If you already have ADMIN_ACCESS_TOKEN_SECRET:

```env
PORT=2107
MONGO_URI=mongodb://localhost:27017/draftsign
ADMIN_ACCESS_TOKEN_SECRET=your_existing_admin_secret
CORS_ORIGIN=http://localhost:5173
```

The support service will use `ADMIN_ACCESS_TOKEN_SECRET` for both agent and admin tokens if `AGENT_ACCESS_TOKEN_SECRET` is not set.

### If you want separate secrets:

```env
PORT=2107
MONGO_URI=mongodb://localhost:27017/draftsign
AGENT_ACCESS_TOKEN_SECRET=agent_secret_12345
ADMIN_ACCESS_TOKEN_SECRET=admin_secret_67890
CORS_ORIGIN=http://localhost:5173
```

## Verification

After setting up, check that the service starts without errors:

```bash
cd Backend/services/support-service
npm run dev
```

You should see: "Support Service running on port 2107"

If you see "JWT Secret missing!" errors, check your `.env` file.

## Testing Agent Login

After setting up environment variables:

1. Create an agent using the seeder:
```bash
npm run seed:agents
```

2. Login at: `http://localhost:5173/support/login`
   - Email: `agent@draftnsign.com`
   - Password: `agent123`

3. If login fails with token errors, verify:
   - `.env` file exists in `Backend/services/support-service/`
   - At least one JWT secret is set
   - Service is restarted after adding env variables

