const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'InventoryDB',
  multipleStatements: true
};

async function fix() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('🛠️ Fixing Procedures...');

  const sql = `
    DROP PROCEDURE IF EXISTS add_item;
    CREATE PROCEDURE add_item(
        IN p_sku VARCHAR(50), IN p_name VARCHAR(100), IN p_category VARCHAR(50),
        IN p_cost DECIMAL(10,2), IN p_sell DECIMAL(10,2), IN p_discount DECIMAL(5,2),
        IN p_quantity INT, IN p_unit VARCHAR(20), IN p_min_stock INT, IN p_supplier INT
    )
    BEGIN
        INSERT INTO Items(sku, item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id)
        VALUES (p_sku, p_name, p_category, p_cost, p_sell, p_discount, p_quantity, p_unit, p_min_stock, p_supplier);
    END;

    DROP PROCEDURE IF EXISTS update_stock;
    CREATE PROCEDURE update_stock(IN p_item_id INT, IN p_quantity INT)
    BEGIN
        UPDATE Items SET quantity = quantity + p_quantity WHERE item_id = p_item_id;
    END;
  `;

  try {
    await connection.query("DROP PROCEDURE IF EXISTS add_item");
    await connection.query(`
        CREATE PROCEDURE add_item(
            IN p_sku VARCHAR(50), IN p_name VARCHAR(100), IN p_category VARCHAR(50),
            IN p_cost DECIMAL(10,2), IN p_sell DECIMAL(10,2), IN p_discount DECIMAL(5,2),
            IN p_quantity INT, IN p_unit VARCHAR(20), IN p_min_stock INT, IN p_supplier INT
        )
        BEGIN
            INSERT INTO Items(sku, item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id)
            VALUES (p_sku, p_name, p_category, p_cost, p_sell, p_discount, p_quantity, p_unit, p_min_stock, p_supplier);
        END
    `);

    await connection.query("DROP PROCEDURE IF EXISTS update_stock");
    await connection.query(`
        CREATE PROCEDURE update_stock(IN p_item_id INT, IN p_quantity INT)
        BEGIN
            UPDATE Items SET quantity = quantity + p_quantity WHERE item_id = p_item_id;
        END
    `);
    console.log('✅ Procedures add_item and update_stock created/updated.');
  } catch (err) {
    console.error('❌ Error fixing procedures:', err.message);
  } finally {
    await connection.end();
  }
}

fix();
