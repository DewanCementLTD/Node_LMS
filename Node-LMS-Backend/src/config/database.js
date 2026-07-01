import oracledb from 'oracledb';
import 'dotenv/config';

// Enable Thick mode to support older Oracle DB versions (< 12.1).
// Requires Oracle Instant Client installed; pass libDir if not on system PATH.
try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (err) {
  console.error('Failed to initialize Oracle Thick mode:', err);
  process.exit(1);
}

console.log('out')
export const getDirectConnection = async () => {
  try {
    console.log('in')
    const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_DSN
      
    });
    return connection;
  } catch (err) {
    console.error('Failed to establish direct database connection:', err);
    throw err;
  }
};