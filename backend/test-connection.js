const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing database connection...');
console.log('Database URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
