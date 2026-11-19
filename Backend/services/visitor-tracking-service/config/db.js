const { Pool } = require('pg');

let pool;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.TRACKING_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TRACKING_DATABASE_URL is required for visitor-tracking-service');
  }
  pool = new Pool({
    connectionString,
    max: Number(process.env.TRACKING_PG_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
  });
  pool.on('error', (err) => {
    console.error('[visitor-tracking] idle client error', err.message);
  });
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getPool, query, withTransaction };
