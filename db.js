const mysql = require('mysql2');
require('dotenv').config({ path: __dirname + '/.env' });

// Configure your MySQL credentials here
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD, // Update this with your MySQL password
  database: 'InventoryDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
