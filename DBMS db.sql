CREATE DATABASE InventoryDB;
USE InventoryDB;

#table for users
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    last_login TIMESTAMP
);

#table for user login logs
CREATE TABLE User_Login_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

#table for suppliers
CREATE TABLE Suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

#table for items
CREATE TABLE Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    discount DECIMAL(5,2) DEFAULT 0 CHECK (discount >= 0),
    quantity INT NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(20) NOT NULL,
    min_stock_level INT NOT NULL CHECK (min_stock_level >= 0),
    supplier_id INT,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

#table for inventory logs
CREATE TABLE Inventory_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('ADD', 'UPDATE', 'DELETE')),
    quantity_change INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

#table for transactions
CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity_sold * selling_price) STORED,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

#table for alerts
CREATE TABLE Alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('LOW', 'CRITICAL', 'OUT')),
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

#data INsertions
INSERT INTO Suppliers (supplier_name, contact_number, email, location, status) VALUES
('ABC Traders', '9876543210', 'abc@gmail.com', 'Chennai', 'ACTIVE'),
('Global Supplies', '9876543211', 'global@gmail.com', 'Bangalore', 'ACTIVE'),
('Fresh Mart', '9876543212', 'fresh@gmail.com', 'Hyderabad', 'ACTIVE'),
('Tech Distributors', '9876543213', 'tech@gmail.com', 'Mumbai', 'ACTIVE'),
('Home Needs', '9876543214', 'home@gmail.com', 'Delhi', 'ACTIVE');

INSERT INTO Users (first_name, middle_name, last_name, email, phone, address, last_login) VALUES
('Rahul', 'Kumar', 'Sharma', 'rahul@gmail.com', '9000000001', 'Chennai', NOW()),
('Anjali', NULL, 'Reddy', 'anjali@gmail.com', '9000000002', 'Hyderabad', NOW()),
('Vikram', 'Singh', 'Patel', 'vikram@gmail.com', '9000000003', 'Mumbai', NOW()),
('Sneha', NULL, 'Iyer', 'sneha@gmail.com', '9000000004', 'Chennai', NOW()),
('Arjun', 'Dev', 'Nair', 'arjun@gmail.com', '9000000005', 'Kerala', NOW());

INSERT INTO Items 
(sku, item_name, category, cost_price, selling_price, discount, quantity, unit, min_stock_level, supplier_id) 
VALUES
('SKU001', 'Rice', 'Groceries', 40, 50, 5, 100, 'kg', 20, 1),
('SKU002', 'Wheat', 'Groceries', 30, 40, 3, 80, 'kg', 15, 1),
('SKU003', 'Sugar', 'Groceries', 35, 45, 2, 60, 'kg', 10, 2),
('SKU004', 'Salt', 'Groceries', 10, 15, 1, 200, 'kg', 30, 2),
('SKU005', 'Milk', 'Dairy', 25, 35, 2, 50, 'litre', 10, 3),
('SKU006', 'Curd', 'Dairy', 20, 30, 1, 40, 'litre', 8, 3),
('SKU007', 'Butter', 'Dairy', 45, 60, 5, 30, 'kg', 5, 3),
('SKU008', 'Cheese', 'Dairy', 60, 80, 5, 25, 'kg', 5, 3),
('SKU009', 'Shampoo', 'Personal Care', 120, 150, 10, 70, 'units', 20, 4),
('SKU010', 'Soap', 'Personal Care', 25, 35, 2, 150, 'units', 30, 4),
('SKU011', 'Toothpaste', 'Personal Care', 50, 70, 5, 90, 'units', 20, 4),
('SKU012', 'Face Wash', 'Personal Care', 80, 110, 8, 60, 'units', 15, 4),
('SKU013', 'Notebook', 'Stationery', 30, 45, 3, 120, 'units', 25, 5),
('SKU014', 'Pen', 'Stationery', 5, 10, 1, 300, 'units', 50, 5),
('SKU015', 'Pencil', 'Stationery', 3, 7, 1, 250, 'units', 50, 5),
('SKU016', 'Eraser', 'Stationery', 2, 5, 0, 200, 'units', 40, 5),
('SKU017', 'Marker', 'Stationery', 20, 30, 2, 100, 'units', 20, 5),
('SKU018', 'Detergent', 'Household', 90, 120, 10, 80, 'kg', 20, 2),
('SKU019', 'Dishwash Liquid', 'Household', 70, 100, 5, 60, 'litre', 15, 2),
('SKU020', 'Floor Cleaner', 'Household', 85, 120, 8, 50, 'litre', 10, 2);

INSERT INTO User_Login_Logs (user_id, login_time, logout_time) VALUES
(1, NOW(), NOW()),
(2, NOW(), NOW()),
(3, NOW(), NOW()),
(4, NOW(), NOW()),
(5, NOW(), NOW());

INSERT INTO Transactions (item_id, quantity_sold, selling_price) VALUES
(1, 10, 50),
(2, 5, 40),
(3, 8, 45),
(4, 20, 15),
(5, 6, 35),
(6, 4, 30),
(7, 3, 60),
(8, 2, 80),
(9, 7, 150),
(10, 15, 35);

INSERT INTO Inventory_Logs (item_id, change_type, quantity_change) VALUES
(1, 'ADD', 50),
(2, 'UPDATE', -10),
(3, 'ADD', 30),
(4, 'UPDATE', -20),
(5, 'ADD', 25),
(6, 'UPDATE', -5),
(7, 'ADD', 15),
(8, 'UPDATE', -3),
(9, 'ADD', 40),
(10, 'UPDATE', -15);

INSERT INTO Alerts (item_id, alert_type, message) VALUES
(3, 'LOW', 'Stock below minimum level'),
(5, 'CRITICAL', 'Stock nearing out of stock'),
(8, 'LOW', 'Stock below threshold'),
(12, 'CRITICAL', 'Stock very low'),
(15, 'OUT', 'Item out of stock');

#i had to change the supplier_id(foreign key) to Not Null so that suplier count is atleast one
ALTER TABLE Items DROP FOREIGN KEY items_ibfk_1;
ALTER TABLE Items
ADD CONSTRAINT fk_supplier
FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

#basic queries
SELECT * FROM Items;

SELECT item_id, item_name, quantity
FROM Items
WHERE quantity < min_stock_level;

SELECT item_id, item_name, selling_price
FROM Items
WHERE selling_price > 100;
	#only perform this if asked, because it will chane the values in the main table
UPDATE Items
SET quantity = quantity + 10
WHERE item_id = 1;
	#this also perform only when asked
DELETE FROM Alerts
WHERE alert_id = 1;

SELECT COUNT(*) AS total_items FROM Items;

SELECT AVG(selling_price) AS avg_price FROM Items;

#join queries
	-- Item + Supplier + Stock
SELECT I.item_name, S.supplier_name, I.quantity
FROM Items I
JOIN Suppliers S ON I.supplier_id = S.supplier_id;

	-- Transactions with item details
SELECT T.transaction_id, I.item_name, T.quantity_sold
FROM Transactions T
JOIN Items I ON T.item_id = I.item_id;

	-- Sales with revenue
SELECT I.item_name, T.quantity_sold, T.selling_price,
T.total_amount AS revenue
FROM Transactions T
JOIN Items I ON T.item_id = I.item_id;

	-- Supplier with total stock
SELECT S.supplier_name, SUM(I.quantity) AS total_stock
FROM Suppliers S
JOIN Items I ON S.supplier_id = I.supplier_id
GROUP BY S.supplier_name;

	-- Transactions with current stock
SELECT T.transaction_id, I.quantity AS current_stock
FROM Transactions T
JOIN Items I ON T.item_id = I.item_id;

#subqueries
-- Items above average stock
SELECT item_id, item_name, quantity
FROM Items
WHERE quantity > (SELECT AVG(quantity) FROM Items);

	-- Highest selling price transaction
SELECT item_id, selling_price
FROM Transactions
WHERE selling_price = (SELECT MAX(selling_price) FROM Transactions);

	-- Suppliers of high-stock items
SELECT DISTINCT supplier_id
FROM Items
WHERE item_id IN (
    SELECT item_id FROM Items WHERE quantity > 100
);

	-- Transactions above average amount
SELECT transaction_id
FROM Transactions
WHERE total_amount > (
    SELECT AVG(total_amount) FROM Transactions
);

	-- Items never sold
SELECT item_id, item_name
FROM Items
WHERE item_id NOT IN (
    SELECT item_id FROM Transactions
);

#views
	-- Low Stock View
CREATE VIEW LowStock AS
SELECT item_id, item_name, quantity
FROM Items
WHERE quantity < min_stock_level;

	-- Revenue View
CREATE VIEW RevenueView AS
SELECT item_id, total_amount AS revenue
FROM Transactions;

	-- Supplier Items View
CREATE VIEW SupplierItems AS
SELECT S.supplier_name, I.item_name
FROM Suppliers S
JOIN Items I ON S.supplier_id = I.supplier_id;

	-- Transaction Summary View
CREATE VIEW TransactionSummary AS
SELECT transaction_id, total_amount
FROM Transactions;

	-- Stock View
CREATE VIEW StockView AS
SELECT item_id, item_name, quantity
FROM Items;

SELECT * FROM LowStock;
SELECT * FROM RevenueView;
SELECT * FROM SupplierItems;
SELECT * FROM TransactionSummary;
SELECT * FROM StockView;

#PL/SQL 
#procedure
	-- to add a new item
DELIMITER //
CREATE PROCEDURE add_item(
    IN p_sku VARCHAR(50),
    IN p_name VARCHAR(100),
    IN p_category VARCHAR(50),
    IN p_cost DECIMAL(10,2),
    IN p_sell DECIMAL(10,2),
    IN p_discount DECIMAL(5,2),
    IN p_quantity INT,
    IN p_unit VARCHAR(20),
    IN p_min_stock INT,
    IN p_supplier INT
)
BEGIN
    INSERT INTO Items(
        sku, item_name, category, cost_price, selling_price,
        discount, quantity, unit, min_stock_level, supplier_id
    )
    VALUES (
        p_sku, p_name, p_category, p_cost, p_sell,
        p_discount, p_quantity, p_unit, p_min_stock, p_supplier
    );
END//
DELIMITER ;

	-- to update stock
DELIMITER //
CREATE PROCEDURE update_stock(
    IN p_item_id INT,
    IN p_quantity INT
)
BEGIN
    UPDATE Items
    SET quantity = quantity + p_quantity
    WHERE item_id = p_item_id;
END//
DELIMITER ;

	-- to get item details
DELIMITER //
CREATE PROCEDURE get_item_details(
    IN p_item_id INT
)
BEGIN
    SELECT * FROM Items
    WHERE item_id = p_item_id;
END//
DELIMITER ;

CALL add_item('SKU021', 'Test Item', 'Test', 10, 15, 1, 20, 'units', 5, 1);
CALL update_stock(1, 10);
CALL get_item_details(1);

#functions
	-- Calculate Profit per item
DELIMITER //
CREATE FUNCTION get_profit(p_item_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE profit DECIMAL(10,2);

    SELECT SUM((T.selling_price - I.cost_price) * T.quantity_sold)
    INTO profit
    FROM Transactions T
    JOIN Items I ON T.item_id = I.item_id
    WHERE T.item_id = p_item_id;

    RETURN IFNULL(profit, 0);
END//
DELIMITER ;

	-- Get Total Revenue for an Item
DELIMITER //
CREATE FUNCTION get_total_revenue(p_item_id INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE total_rev DECIMAL(12,2);

    SELECT SUM(total_amount)
    INTO total_rev
    FROM Transactions
    WHERE item_id = p_item_id;

    RETURN IFNULL(total_rev, 0);
END//
DELIMITER ;

SELECT get_profit(1);
SELECT get_total_revenue(1);

#triggers
	-- Reduce stock after sale
DELIMITER //
CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON Transactions
FOR EACH ROW
BEGIN
    UPDATE Items
    SET quantity = quantity - NEW.quantity_sold
    WHERE item_id = NEW.item_id;
END//
DELIMITER ;

	-- Prevent negative stock
DELIMITER //
CREATE TRIGGER trg_check_stock
BEFORE UPDATE ON Items
FOR EACH ROW
BEGIN
    IF NEW.quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock cannot be negative';
    END IF;
END//
DELIMITER ;

#cursor
-- Implicit cursors are automatically created by MySQL when executing SQL statements
-- Explicit Cursor
DELIMITER //
CREATE PROCEDURE cursor_demo()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE name_var VARCHAR(100);

    DECLARE cur1 CURSOR FOR 
        SELECT item_name FROM Items;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur1;

    read_loop: LOOP
        FETCH cur1 INTO name_var;
        IF done THEN
            LEAVE read_loop;
        END IF;
    END LOOP;

    CLOSE cur1;
END//
DELIMITER ;

CALL cursor_demo();

#exceptional handling
DELIMITER //
CREATE PROCEDURE safe_update_stock(
    IN p_item_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'Error occurred while updating stock' AS message;
    END;

    UPDATE Items
    SET quantity = quantity + p_quantity
    WHERE item_id = p_item_id;
END//
DELIMITER ;

CALL safe_update_stock(1, 10);

USE INventoryDB;

SHOW TABLES FROM InventoryDB;

SELECT AVG(cost_price) AS avg_cost_price FROM Items;

DESC TABLE item;

-- Sample Table
CREATE TABLE Asset_Record (
    item_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_phone VARCHAR(15) NOT NULL,
    transaction_id INT NOT NULL,
    quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    user_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (item_id, transaction_id)
);

-- Sample Table Data Insertion
INSERT INTO Asset_Record VALUES
(1, 'Rice', 'Groceries', 'ABC Traders', '9876543210', 101, 10, 50, 'Rahul'),
(1, 'Rice', 'Groceries', 'ABC Traders', '9876543210', 102, 5, 50, 'Anjali'),
(2, 'Wheat', 'Groceries', 'ABC Traders', '9876543210', 103, 8, 40, 'Vikram'),
(3, 'Milk', 'Dairy', 'Fresh Mart', '9876543212', 104, 6, 35, 'Sneha'),
(3, 'Milk', 'Dairy', 'Fresh Mart', '9876543212', 105, 4, 35, 'Arjun'),
(4, 'Sugar', 'Groceries', 'Global Supplies', '9876543211', 106, 7, 45, 'Rahul'),
(5, 'Salt', 'Groceries', 'Global Supplies', '9876543211', 107, 12, 15, 'Anjali'),
(6, 'Butter', 'Dairy', 'Fresh Mart', '9876543212', 108, 3, 60, 'Vikram'),
(7, 'Cheese', 'Dairy', 'Fresh Mart', '9876543212', 109, 2, 80, 'Sneha'),
(8, 'Shampoo', 'Personal Care', 'Tech Distributors', '9876543213', 110, 6, 150, 'Arjun'),
(9, 'Soap', 'Personal Care', 'Tech Distributors', '9876543213', 111, 15, 35, 'Rahul'),
(10, 'Notebook', 'Stationery', 'Home Needs', '9876543214', 112, 20, 45, 'Anjali');

-- 1NF Table Creation and Insertion
CREATE TABLE Asset_Record_1NF (
    item_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_phone VARCHAR(15) NOT NULL,
    transaction_id INT NOT NULL,
    quantity_sold INT NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (item_id, transaction_id)
);

INSERT INTO Asset_Record_1NF
SELECT * FROM Asset_Record;

-- 2NF Table Creation and Insertion
CREATE TABLE Items_2NF (
    item_id INT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_phone VARCHAR(15) NOT NULL
);
INSERT INTO Items_2NF (item_id, item_name, category, supplier_name, supplier_phone)
SELECT DISTINCT item_id, item_name, category, supplier_name, supplier_phone
FROM Asset_Record_1NF;

CREATE TABLE Transactions_2NF (
    transaction_id INT PRIMARY KEY,
    item_id INT,
    quantity_sold INT NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES Items_2NF(item_id)
);
INSERT INTO Transactions_2NF (transaction_id, item_id, quantity_sold, selling_price, user_name)
SELECT transaction_id, item_id, quantity_sold, selling_price, user_name
FROM Asset_Record_1NF;

-- 3NF Table Creation and Insertion
CREATE TABLE Suppliers_3NF (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) UNIQUE,
    supplier_phone VARCHAR(15)
);
INSERT INTO Suppliers_3NF (supplier_name, supplier_phone)
SELECT DISTINCT supplier_name, supplier_phone
FROM Items_2NF;

CREATE TABLE Items_3NF (
    item_id INT PRIMARY KEY,
    item_name VARCHAR(100),
    category VARCHAR(50),
    supplier_id INT,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers_3NF(supplier_id)
);
INSERT INTO Items_3NF (item_id, item_name, category, supplier_id)
SELECT I.item_id, I.item_name, I.category, S.supplier_id
FROM Items_2NF I
JOIN Suppliers_3NF S
ON I.supplier_name = S.supplier_name;

-- Transactions_2NF  →  same as final (no change needed)

-- 1NF
SELECT * FROM Asset_Record_1NF;

-- 2NF
SELECT * FROM Items_2NF;
SELECT * FROM Transactions_2NF;

-- 3NF
SELECT * FROM Suppliers_3NF;
SELECT * FROM Items_3NF;
SELECT * FROM Transactions_2NF;

-- Transaction 1 (Basic Sale)
START TRANSACTION;

UPDATE Items
SET quantity = quantity - 5
WHERE item_id = 1;

INSERT INTO Transactions (item_id, quantity_sold, selling_price)
VALUES (1, 5, 50);

COMMIT;

-- Transaction 2 (With Savepoint + Rollback)
START TRANSACTION;

UPDATE Items
SET quantity = quantity - 3
WHERE item_id = 2;

SAVEPOINT sp1;

UPDATE Items
SET quantity = quantity - 1000
WHERE item_id = 2;

ROLLBACK TO sp1;

COMMIT;

-- Transaction 3 (Multiple Updates)
START TRANSACTION;

UPDATE Items SET quantity = quantity - 2 WHERE item_id = 3;
UPDATE Items SET quantity = quantity - 1 WHERE item_id = 4;

COMMIT;
-- Transaction 4 (Insert + Rollback)
START TRANSACTION;

INSERT INTO Transactions (item_id, quantity_sold, selling_price)
VALUES (5, 10, 35);

ROLLBACK;

-- Transaction 5 (Safe Update with Commit)
START TRANSACTION;

UPDATE Items
SET quantity = quantity + 10
WHERE item_id = 1;

COMMIT;

-- CONCURRENCY CONTROL
-- 1. Row-Level Lock
START TRANSACTION;

SELECT * FROM Items
WHERE item_id = 1
FOR UPDATE;

UPDATE Items
SET quantity = quantity - 2
WHERE item_id = 1;

COMMIT;

-- 2. Table-Level Write Lock
LOCK TABLE Items WRITE;

UPDATE Items
SET quantity = quantity + 5
WHERE item_id = 2;

UNLOCK TABLES;

-- 3. Table-Level Read Lock
LOCK TABLE Items READ;

SELECT * FROM Items;

UNLOCK TABLES;

