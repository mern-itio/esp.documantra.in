/**
 * Create/update Selfie Verification auth provider and attach it to plan templates at 2 credits.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts/seed-selfie-auth-provider.js
 *   node scripts/seed-selfie-auth-provider.js --credits=2
 */
const path = require('path');

const subRoot = path.join(__dirname, '../services/subscription-service');
module.paths.unshift(path.join(subRoot, 'node_modules'));

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const AuthProvider = require(path.join(subRoot, 'src/models/AuthProvider'));
const PlanTemplate = require(path.join(subRoot, 'src/models/PlanTemplate'));

const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const credits = Math.max(1, Number(parseArg('credits', '2')) || 2);

const SELFIE_PROVIDER = {
  name: 'Selfie Verification',
  description: 'In-app selfie capture for signer identity verification (KYC-style liveness check).',
  defaultCredits: credits,
  enabled: true,
  isRecommended: false,
  config: {
    providerType: 'selfie_capture',
    apiKeyRef: '',
    requiredFields: [],
    callbackUrl: '',
    extraFields: {},
  },
  uiSchema: {
    securityLevel: 'High',
    estimatedTime: '1 min',
    costInfo: `${credits} credits`,
    compliance: ['ESIGN', 'UETA'],
    icon: 'Camera',
    extraFields: {},
  },
  constraints: {
    country: ['IN', 'US'],
    maxAttempts: 3,
  },
};

async function upsertSelfieProvider() {
  let provider = await AuthProvider.findOne({ 'config.providerType': 'selfie_capture' });
  if (!provider) {
    provider = await AuthProvider.findOne({
      name: { $regex: /selfie/i },
    });
  }

  if (provider) {
    provider.name = SELFIE_PROVIDER.name;
    provider.description = SELFIE_PROVIDER.description;
    provider.defaultCredits = credits;
    provider.enabled = true;
    provider.config = { ...(provider.config || {}), ...SELFIE_PROVIDER.config };
    provider.uiSchema = { ...(provider.uiSchema || {}), ...SELFIE_PROVIDER.uiSchema };
    provider.constraints = { ...(provider.constraints || {}), ...SELFIE_PROVIDER.constraints };
    await provider.save();
    console.log('Updated existing selfie provider:', provider._id.toString());
  } else {
    provider = await AuthProvider.create(SELFIE_PROVIDER);
    console.log('Created selfie provider:', provider._id.toString());
  }

  return provider;
}

async function attachToPlans(providerId) {
  const plans = await PlanTemplate.find({});
  let updatedCount = 0;

  for (const plan of plans) {
    const services = plan.services || [];
    if (!services.includes('esign') && !services.includes('auth')) {
      continue;
    }

    const authCosts = Array.isArray(plan.authCosts) ? [...plan.authCosts] : [];
    const idx = authCosts.findIndex((item) => String(item.authId) === String(providerId));

    if (idx >= 0) {
      if (authCosts[idx].credits !== credits) {
        authCosts[idx].credits = credits;
        plan.authCosts = authCosts;
        await plan.save();
        updatedCount += 1;
        console.log(`Updated plan "${plan.name}" selfie cost -> ${credits}`);
      }
      continue;
    }

    authCosts.push({ authId: providerId, credits });
    plan.authCosts = authCosts;
    await plan.save();
    updatedCount += 1;
    console.log(`Added selfie provider to plan "${plan.name}" at ${credits} credits`);
  }

  return updatedCount;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing in Backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const provider = await upsertSelfieProvider();
  const planUpdates = await attachToPlans(provider._id);

  console.log('\n--- Selfie auth provider seed complete ---');
  console.log('Provider ID:', provider._id.toString());
  console.log('Plan templates updated:', planUpdates);
  console.log('Credits per use:', credits);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
