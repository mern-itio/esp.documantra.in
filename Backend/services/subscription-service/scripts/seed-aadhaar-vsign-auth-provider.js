/**
 * Create/update Aadhaar eSign (VSign) auth provider and attach to plan templates.
 * Shows in admin Auth Providers dashboard like SMS / DigiLocker.
 *
 * Usage:
 *   npm run seed:aadhaar-vsign-auth
 *   node scripts/seed-aadhaar-vsign-auth-provider.js --credits=2
 */
const path = require('path');

const serviceRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(serviceRoot, '.env') });

const mongoose = require('mongoose');
const AuthProvider = require(path.join(serviceRoot, 'src/models/AuthProvider'));
const PlanTemplate = require(path.join(serviceRoot, 'src/models/PlanTemplate'));

const PROVIDER_TYPE = 'aadhaar_vsign';

const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const credits = Math.max(1, Number(parseArg('credits', '2')) || 2);

const DEFINITION = {
  lookupType: PROVIDER_TYPE,
  fallbackName: /aadhaar\s*e?sign|vsign/i,
  payload: {
    name: 'Aadhaar eSign (VSign)',
    description:
      'Signer draws a signature, then verifies with Aadhaar OTP via VSign. Requires VSign enabled under e-sign admin.',
    defaultCredits: credits,
    enabled: true,
    isRecommended: true,
    config: {
      providerType: PROVIDER_TYPE,
      apiKeyRef: '',
      requiredFields: [],
      callbackUrl: '',
      extraFields: {},
    },
    uiSchema: {
      securityLevel: 'Maximum',
      estimatedTime: '2-5 min',
      costInfo: `${credits} credits`,
      compliance: ['IT Act', 'Aadhaar eSign', 'VSign'],
      icon: 'Fingerprint',
      extraFields: {},
    },
    constraints: { country: ['IN'], maxAttempts: 3 },
  },
  credits,
};

async function upsertProvider() {
  let provider = await AuthProvider.findOne({ 'config.providerType': DEFINITION.lookupType });
  if (!provider) {
    provider = await AuthProvider.findOne({ name: { $regex: DEFINITION.fallbackName } });
  }

  if (provider) {
    Object.assign(provider, {
      name: DEFINITION.payload.name,
      description: DEFINITION.payload.description,
      defaultCredits: DEFINITION.payload.defaultCredits,
      enabled: true,
      isRecommended: true,
      config: { ...(provider.config || {}), ...DEFINITION.payload.config },
      uiSchema: { ...(provider.uiSchema || {}), ...DEFINITION.payload.uiSchema },
      constraints: { ...(provider.constraints || {}), ...DEFINITION.payload.constraints },
    });
    await provider.save();
    console.log(`Updated provider (${DEFINITION.lookupType}):`, provider._id.toString());
  } else {
    provider = await AuthProvider.create(DEFINITION.payload);
    console.log(`Created provider (${DEFINITION.lookupType}):`, provider._id.toString());
  }

  return provider;
}

async function attachToPlans(providerId, planCredits) {
  const plans = await PlanTemplate.find({});
  let updatedCount = 0;

  for (const plan of plans) {
    const services = plan.services || [];
    const authCosts = Array.isArray(plan.authCosts) ? [...plan.authCosts] : [];
    const hasEsignOrAuth =
      services.includes('esign') ||
      services.includes('auth') ||
      authCosts.length > 0;
    if (!hasEsignOrAuth) continue;

    const idx = authCosts.findIndex((item) => String(item.authId) === String(providerId));

    if (idx >= 0) {
      if (authCosts[idx].credits !== planCredits) {
        authCosts[idx].credits = planCredits;
        plan.authCosts = authCosts;
        await plan.save();
        updatedCount += 1;
      }
      continue;
    }

    authCosts.push({ authId: providerId, credits: planCredits });
    plan.authCosts = authCosts;
    await plan.save();
    updatedCount += 1;
  }

  return updatedCount;
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing in services/subscription-service/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const provider = await upsertProvider();
  const planUpdates = await attachToPlans(provider._id, DEFINITION.credits);
  console.log('Plan templates updated:', planUpdates);
  console.log('\n--- Aadhaar eSign (VSign) auth provider seed complete ---');
  console.log('Admin → Auth Providers should list "Aadhaar eSign (VSign)".');
  console.log('Toggle Enabled/Disabled there; also keep VSign kit ready under /e-sign/admin/vsign.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
