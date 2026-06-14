const { Client } = require('pg');
const dns = require('dns').promises;
require('dotenv').config();

// 🔧 Force IPv4
dns.setDefaultResultOrder('ipv4first');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
  family: 4, // Force IPv4
});

console.log('🔍 Probando conexión a la base de datos...');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Username: ${process.env.DB_USERNAME}`);
console.log('');

client.connect((err) => {
  if (err) {
    console.error('❌ Error conectando:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa!');
  
  client.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Error en query:', err.message);
      process.exit(1);
    }
    console.log('✅ Query ejecutada:', res.rows[0]);
    client.end();
    process.exit(0);
  });
});
