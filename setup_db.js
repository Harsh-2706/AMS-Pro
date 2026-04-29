const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: __dirname + '/.env' });

async function setup() {
  // Connection without DB selected first
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true // THIS IS THE KEY FIX
  });

  console.log('🚀 Starting "Silver Bullet" Database Setup...');

  try {
    // 1. Create and Select Database
    await connection.query('CREATE DATABASE IF NOT EXISTS InventoryDB');
    await connection.query('USE InventoryDB');
    console.log('✅ Database "InventoryDB" Created/Ready.');

    // 2. Read the entire SQL file
    let sqlFile = fs.readFileSync('DBMS_db_updated.sql', 'utf8');
    
    // Remove CREATE DATABASE and USE statements to avoid conflicts
    sqlFile = sqlFile.replace(/CREATE DATABASE InventoryDB;/i, '');
    sqlFile = sqlFile.replace(/USE InventoryDB;/i, '');

    // 3. Execute EVERYTHING in one go
    console.log('📡 Injecting Tables, Procedures, and Triggers...');
    await connection.query('USE InventoryDB');
    await connection.query(sqlFile);
    
    console.log('🎉 DATABASE SETUP SUCCESSFUL!');
    console.log('You can now run "node server.js" and everything will be connected.');
  } catch (err) {
    console.error('❌ SETUP FAILED:', err.message);
    console.log('Note: If you see "Procedure already exists", it means the tables were already built.');
  } finally {
    await connection.end();
  }
}

setup();
