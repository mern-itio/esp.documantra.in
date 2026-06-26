/**
 * Create or update a user + admin with the same email (separate collections).
 * Usage:
 *   node scripts/seed-user-admin.js
 *   node scripts/seed-user-admin.js --email=user@example.com --password=Secret@123 --name="Full Name"
 */
const path = require('path');

const authRoot = path.join(__dirname, '../services/auth-service');

module.paths.unshift(path.join(authRoot, 'node_modules'));

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const AdminUser = require(path.join(authRoot, 'models/Admin'));
const User = require(path.join(authRoot, 'models/User'));

const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const email = parseArg('email', 'sahil.bhingare@secunatix.com').trim().toLowerCase();
const password = parseArg('password', 'Secunatix@123');
const fullname = parseArg('name', 'Sahil Bhingare');

const seedPhoneForEmail = (emailValue) => {
  let hash = 0;
  const normalized = String(emailValue).trim().toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `+91${String(hash % 1_000_000_000).padStart(9, '0')}`;
};

const phone = parseArg('phone', seedPhoneForEmail(email));

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing in Backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  let admin = await AdminUser.findOne({ email });
  if (admin) {
    admin.fullname = fullname;
    admin.password = password;
    admin.role = 'superadmin';
    admin.status = true;
    admin.permissions = ['MANAGE_USERS', 'VIEW_LOGS', 'MANAGE_SETTINGS'];
    await admin.save();
    console.log('Updated existing admin:', email);
  } else {
    admin = await AdminUser.create({
      fullname,
      email,
      password,
      role: 'superadmin',
      status: true,
      permissions: ['MANAGE_USERS', 'VIEW_LOGS', 'MANAGE_SETTINGS'],
    });
    console.log('Created admin:', email);
  }

  let user = await User.findOne({ email });
  if (user) {
    user.fullname = fullname;
    user.password = password;
    user.emailVerified = true;
    user.phoneVerified = false;
    user.status = true;
    user.plan = user.plan || 'free';
    user.isFirstLogin = false;
    if (!user.phone) {
      user.phone = phone;
    }
    await user.save();
    console.log('Updated existing user:', email);
  } else {
    user = await User.create({
      fullname,
      email,
      password,
      company: 'Secunatix',
      phone,
      plan: 'free',
      emailVerified: true,
      phoneVerified: false,
      status: true,
      isFirstLogin: false,
    });
    console.log('Created user:', email);
  }

  console.log('\n--- Login credentials (same email, same password) ---');
  console.log('Email:   ', email);
  console.log('Password:', password);
  console.log('User app:  http://localhost:5173');
  console.log('Admin app: http://localhost:5174/admin/login');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
