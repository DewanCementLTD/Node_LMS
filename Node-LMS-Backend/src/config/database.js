import oracledb from 'oracledb';
import 'dotenv/config';

try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (err) {
  console.error('Failed to initialize Oracle Thick mode:', err);
  process.exit(1);
}

let pool;

// Create the pool once on startup
const initializePool = async () => {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_DSN,
      poolMin: 4,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('Oracle Connection Pool initialized successfully');
  } catch (err) {
    console.error('Failed to create Oracle connection pool:', err);
  }
};

// Immediately invoke pool initialization
initializePool();

// Export the same function signature, but get connection from pool instead
export const getDirectConnection = async () => {
  if (!pool) {
    // Fallback in case pool isn't ready yet
    await initializePool();
  }
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('Failed to get connection from pool:', err);
    throw err;
  }
};
