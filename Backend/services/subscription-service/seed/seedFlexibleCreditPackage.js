const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');
const FlexibleCreditPackage = require('../src/models/flexibleCreditPackage');
connectDB();
const seedFlexibleCreditPackage = async () => {
  try {

    const existing = await FlexibleCreditPackage.findOne();

    if (!existing) {
      await FlexibleCreditPackage.create({
        name: 'Default Credit Plan',
        description: 'Flexible credit pricing plan',
        ranges: [
          {
            min: 1,
            max: 100,
            pricePerCredit: 10
          },
          {
            min: 101,
            max: 200,
            pricePerCredit: 8
          },
          {
            min: 201,
            max: 500,
            pricePerCredit: 6
          }
        ]
      });

      console.log('Default plan seeded');
    } else {
      console.log('Plan already exists');
    }

    process.exit();

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedFlexibleCreditPackage();