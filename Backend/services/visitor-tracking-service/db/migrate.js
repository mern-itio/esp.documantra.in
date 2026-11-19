const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { getPool } = require('../config/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const pool = getPool();
  await pool.query(sql);
  console.log('[visitor-tracking] schema applied');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[visitor-tracking] migrate failed', err);
  process.exit(1);
});
