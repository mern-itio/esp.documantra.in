/**
 * Create/update Surepass DigiLocker Via Link auth provider and attach to plan templates.
 *
 * Usage:
 *   npm run seed:digilocker-auth
 *   node scripts/seed-digilocker-auth-provider.js --credits=2
 */
const path = require('path');

const serviceRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(serviceRoot, '.env') });

const mongoose = require('mongoose');
const AuthProvider = require(path.join(serviceRoot, 'src/models/AuthProvider'));
const PlanTemplate = require(path.join(serviceRoot, 'src/models/PlanTemplate'));

const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const credits = Math.max(1, Number(parseArg('credits', '2')) || 2);

const PROVIDER = {
  lookupType: 'digilocker_link',
  fallbackName: /digilocker|surepass/i,
  payload: {
    name: 'DigiLocker Via Link',
    description: 'Aadhaar verification via Surepass DigiLocker link (sandbox/production).',
    defaultCredits: credits,
    enabled: true,
    isRecommended: false,
    config: {
      providerType: 'digilocker_link',
      apiKeyRef: '',
      requiredFields: [],
      callbackUrl: '',
      extraFields: {
        SUREPASS_API_BASE_URL: 'https://sandbox.surepass.app',
        AUTH_TYPE: '',
        INITIALIZE_PATH: '/api/v1/digilocker/initialize',
      },
    },
    uiSchema: {
      securityLevel: 'Maximum',
      estimatedTime: '2-3 min',
      costInfo: `${credits} credits`,
      compliance: ['KYC', 'AADHAAR', 'DIGILOCKER'],
      icon: 'Shield',
      extraFields: {},
    },
    constraints: { country: ['IN'], maxAttempts: 3 },
  },
};

async function upsertProvider() {
  let provider = await AuthProvider.findOne({ 'config.providerType': PROVIDER.lookupType });
  if (!provider) {
    provider = await AuthProvider.findOne({ name: { $regex: PROVIDER.fallbackName } });
  }

  if (provider) {
    Object.assign(provider, {
      name: PROVIDER.payload.name,
      description: PROVIDER.payload.description,
      defaultCredits: PROVIDER.payload.defaultCredits,
      enabled: true,
      config: { ...(provider.config || {}), ...PROVIDER.payload.config },
      uiSchema: { ...(provider.uiSchema || {}), ...PROVIDER.payload.uiSchema },
      constraints: { ...(provider.constraints || {}), ...PROVIDER.payload.constraints },
    });
    await provider.save();
    console.log(`Updated provider (${PROVIDER.lookupType}):`, provider._id.toString());
  } else {
    provider = await AuthProvider.create(PROVIDER.payload);
    console.log(`Created provider (${PROVIDER.lookupType}):`, provider._id.toString());
  }

  return provider;
}

async function attachToPlans(providerId) {
  const plans = await PlanTemplate.find({});
  let updatedCount = 0;

  for (const plan of plans) {
    const services = plan.services || [];
    if (!services.includes('esign') && !services.includes('auth')) continue;

    const authCosts = Array.isArray(plan.authCosts) ? [...plan.authCosts] : [];
    const idx = authCosts.findIndex((item) => String(item.authId) === String(providerId));

    if (idx >= 0) {
      if (authCosts[idx].credits !== credits) {
        authCosts[idx].credits = credits;
        plan.authCosts = authCosts;
        await plan.save();
        updatedCount += 1;
      }
      continue;
    }

    authCosts.push({ authId: providerId, credits });
    plan.authCosts = authCosts;
    await plan.save();
    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing in services/subscription-service/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const provider = await upsertProvider();
  const planUpdates = await attachToPlans(provider._id);
  console.log('Plan templates updated:', planUpdates);
  console.log('\n--- DigiLocker auth provider seed complete ---');
  console.log('Set apiKeyRef to your Surepass bearer token in Admin > Auth Providers.');
  console.log('Set callbackUrl to: https://<your-domain>/webhook/surepass-digilocker');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
