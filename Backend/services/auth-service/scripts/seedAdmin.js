/**
 * Seed default admin user
 * Run this once: node scripts/seedAdmin.js
 */
require('dotenv').config(); // Loads environment variables
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const AdminUser = require('../models/Admin');


const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI ;
        console.log(mongoUri);
    await mongoose.connect(mongoUri);
    console.log(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@draftnsign.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const adminFullName = process.env.DEFAULT_ADMIN_NAME || 'System Admin';

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists:', adminEmail);
      mongoose.connection.close();
      return;
    }


    const admin = new AdminUser({
      fullname: adminFullName,
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin',
      permissions: ['MANAGE_USERS', 'VIEW_LOGS', 'MANAGE_SETTINGS'],
      status: true
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
