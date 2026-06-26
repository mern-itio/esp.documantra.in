/**
 * Create/update biometric auth providers and attach them to plan templates.
 *
 * Usage:
 *   npm run seed:selfie-auth
 *   node scripts/seed-selfie-auth-provider.js --selfie-credits=2 --liveness-credits=2
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

const selfieCredits = Math.max(1, Number(parseArg('selfie-credits', parseArg('credits', '2'))) || 2);
const livenessCredits = Math.max(1, Number(parseArg('liveness-credits', '2')) || 2);

const PROVIDERS = [
  {
    lookupType: 'selfie_capture',
    fallbackName: /selfie/i,
    payload: {
      name: 'Selfie Verification',
      description: 'Camera selfie with face and image quality validation.',
      defaultCredits: selfieCredits,
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
        costInfo: `${selfieCredits} credits`,
        compliance: ['ESIGN', 'UETA'],
        icon: 'Camera',
        extraFields: {},
      },
      constraints: { country: ['IN', 'US'], maxAttempts: 3 },
    },
    credits: selfieCredits,
  },
  {
    lookupType: 'liveness_check',
    fallbackName: /liveness/i,
    payload: {
      name: 'Liveness Check',
      description: 'Two-step head movement liveness verification with fail validation.',
      defaultCredits: livenessCredits,
      enabled: true,
      isRecommended: false,
      config: {
        providerType: 'liveness_check',
        apiKeyRef: '',
        requiredFields: [],
        callbackUrl: '',
        extraFields: {},
      },
      uiSchema: {
        securityLevel: 'Maximum',
        estimatedTime: '2 min',
        costInfo: `${livenessCredits} credits`,
        compliance: ['KYC', 'LIVENESS'],
        icon: 'ScanFace',
        extraFields: {},
      },
      constraints: { country: ['IN', 'US'], maxAttempts: 3 },
    },
    credits: livenessCredits,
  },
];

async function upsertProvider(definition) {
  let provider = await AuthProvider.findOne({ 'config.providerType': definition.lookupType });
  if (!provider) {
    provider = await AuthProvider.findOne({ name: { $regex: definition.fallbackName } });
  }

  if (provider) {
    Object.assign(provider, {
      name: definition.payload.name,
      description: definition.payload.description,
      defaultCredits: definition.payload.defaultCredits,
      enabled: true,
      config: { ...(provider.config || {}), ...definition.payload.config },
      uiSchema: { ...(provider.uiSchema || {}), ...definition.payload.uiSchema },
      constraints: { ...(provider.constraints || {}), ...definition.payload.constraints },
    });
    await provider.save();
    console.log(`Updated provider (${definition.lookupType}):`, provider._id.toString());
  } else {
    provider = await AuthProvider.create(definition.payload);
    console.log(`Created provider (${definition.lookupType}):`, provider._id.toString());
  }

  return provider;
}

async function attachToPlans(providerId, credits) {
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

  for (const definition of PROVIDERS) {
    const provider = await upsertProvider(definition);
    const planUpdates = await attachToPlans(provider._id, definition.credits);
    console.log(`Plan templates updated for ${definition.lookupType}:`, planUpdates);
  }

  console.log('\n--- Biometric auth provider seed complete ---');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
