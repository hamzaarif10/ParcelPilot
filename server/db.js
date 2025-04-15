const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

let pool;

const connectToDatabase = async () => {
  try {
    pool = await sql.connect(config);
  } catch (error) {
    console.error('Database Connection Failed:', error);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) throw new Error('Database connection not established');
  return pool;
};

module.exports = { connectToDatabase, getPool };
