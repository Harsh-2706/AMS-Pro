const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Global Request Logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`, req.body);
  }
  next();
});

// --- SERVE STATIC FILES ---
app.use(express.static(__dirname));

const PORT = 3001;

// Diagnostic check
async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ MySQL Connected Successfully!');
  } catch (err) {
    console.error('❌ DATABASE ERROR:', err.message);
  }
}
testConnection();

// --- AUTH & LOGGING ---
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ success: false, message: 'User not found' });
    
    const user = users[0];
    // Insert into User_Login_Logs
    const [result] = await db.query('INSERT INTO User_Login_Logs (user_id) VALUES (?)', [user.user_id]);
    const logId = result.insertId;
    
    // Update last_login in Users
    await db.query('UPDATE Users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
    
    res.json({ success: true, user, logId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/logout', async (req, res) => {
  try {
    const { logId } = req.body;
    if (logId) {
      await db.query('UPDATE User_Login_Logs SET logout_time = NOW() WHERE log_id = ?', [logId]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// --- API ROUTES ---

// 0. SCRAPING PROXY (Ultimate Discovery Fallback)
app.get('/api/scrape/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const https = require('https');
    const url = `https://html.duckduckgo.com/html/?q=${sku}`;
    
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        // Regex to find the first search snippet which usually contains the product name
        const match = data.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i);
        if (match) {
          let title = match[1].replace(/<\/?[^>]+(>|$)/g, "").replace(/&[^;]+;/g, " ").trim();
          res.json({ success: true, title });
        } else {
          res.json({ success: false, message: "No search snippet found." });
        }
      });
    }).on('error', (err) => res.json({ success: false, message: err.message }));
  } catch (e) { res.json({ success: false, message: e.message }); }
});

// 1. ITEMS
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT i.*, s.supplier_name FROM Items i LEFT JOIN Suppliers s ON i.supplier_id = s.supplier_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const { sku, item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id } = req.body;
    await db.query('CALL add_item(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [sku, item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id]);
    
    // Log the addition (using SKU to find the item_id safely)
    const [newItem] = await db.query('SELECT item_id FROM Items WHERE sku = ?', [sku]);
    if (newItem.length > 0) {
      await db.query('INSERT INTO Inventory_Logs (item_id, change_type, quantity_change) VALUES (?, "ADD", ?)', [newItem[0].item_id, quantity]);
    }
    
    res.json({ success: true });
  } catch (err) { 
    console.error('ADD ITEM ERROR:', err.message);
    res.status(400).json({ success: false, message: err.message }); 
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id } = req.body;
    
    // Get old quantity for logging
    const [oldItem] = await db.query('SELECT quantity FROM Items WHERE item_id = ?', [id]);
    const quantityChange = quantity - oldItem[0].quantity;

    await db.query(`UPDATE Items SET 
      item_name = ?, category = ?, cost_price = ?, selling_price = ?, 
      discount = ?, quantity = ?, unit = ?, min_stock_level = ?, supplier_id = ? 
      WHERE item_id = ?`, 
      [item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id, id]);

    if (quantityChange !== 0) {
      await db.query('INSERT INTO Inventory_Logs (item_id, change_type, quantity_change) VALUES (?, "UPDATE", ?)', [id, quantityChange]);
    }

    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Items WHERE item_id = ?', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 2. SUPPLIERS
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Suppliers');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { supplier_name, contact_number, email, location } = req.body;
    await db.query('INSERT INTO Suppliers (supplier_name, contact_number, email, location, status) VALUES (?, ?, ?, ?, "ACTIVE")', 
      [supplier_name, contact_number, email, location]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_number, email, location, status } = req.body;
    await db.query('UPDATE Suppliers SET supplier_name = ?, contact_number = ?, email = ?, location = ?, status = ? WHERE supplier_id = ?', 
      [supplier_name, contact_number, email, location, status, id]);
    
    // Log the update
    await db.query('INSERT INTO Supplier_Logs (supplier_id, change_type) VALUES (?, "UPDATE")', [id]);
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Suppliers WHERE supplier_id = ?', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 3. TRANSACTIONS
app.post('/api/transactions', async (req, res) => {
  try {
    const { item_id, quantity_sold } = req.body;
    
    // 1. Check stock level FIRST
    const [itemRows] = await db.query('SELECT quantity, selling_price, item_name FROM Items WHERE item_id = ?', [item_id]);
    if (itemRows.length === 0) throw new Error("Item not found");
    
    const available = itemRows[0].quantity;
    if (available < quantity_sold) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${itemRows[0].item_name}. Available: ${available}` });
    }

    // 2. Perform Transaction
    await db.query('INSERT INTO Transactions (item_id, quantity_sold, selling_price) VALUES (?, ?, ?)', 
      [item_id, quantity_sold, itemRows[0].selling_price]);
    
    // 3. Manually update stock to ensure sync (in case trigger is missing)
    await db.query('UPDATE Items SET quantity = quantity - ? WHERE item_id = ?', [quantity_sold, item_id]);
    
    // 4. Log the change
    await db.query('INSERT INTO Inventory_Logs (item_id, change_type, quantity_change) VALUES (?, "UPDATE", ?)', [item_id, -quantity_sold]);
    
    res.json({ success: true });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, i.item_name 
      FROM Transactions t 
      JOIN Items i ON t.item_id = i.item_id 
      ORDER BY transaction_date DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. LOGS
app.get('/api/logs/inventory', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, i.item_name 
      FROM Inventory_Logs l 
      JOIN Items i ON l.item_id = i.item_id 
      ORDER BY log_date DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/logs/user', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.first_name, u.last_name 
      FROM User_Login_Logs l 
      JOIN Users u ON l.user_id = u.user_id 
      ORDER BY login_time DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/logs/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, s.supplier_name 
      FROM Supplier_Logs l 
      JOIN Suppliers s ON l.supplier_id = s.supplier_id 
      ORDER BY log_date DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. DASHBOARD
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [[{totalItems}]] = await db.query('SELECT COUNT(*) as totalItems FROM Items');
    const [[{revenue}]] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM Transactions');
    const [lowStockItems] = await db.query('SELECT item_name FROM Items WHERE quantity < min_stock_level');
    
    // Real Chart Data: Sales per day for the last 7 days
    const [chartRows] = await db.query(`
      SELECT DATE_FORMAT(transaction_date, '%Y-%m-%d') as day_key, DATE_FORMAT(transaction_date, '%a') as label, SUM(total_amount) as value 
      FROM Transactions 
      WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY day_key, label
      ORDER BY day_key ASC
    `);

    res.json({ 
      totalItems, 
      revenue, 
      lowStockCount: lowStockItems.length, 
      alerts: lowStockItems.map(i => `${i.item_name} is low stock`),
      chartData: {
        labels: chartRows.map(r => r.label),
        data: chartRows.map(r => r.value)
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Use app.use for the fallback to avoid path-to-regexp wildcard issues
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API route not found' });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AMS Pro System Live at: http://localhost:${PORT}`);
});
