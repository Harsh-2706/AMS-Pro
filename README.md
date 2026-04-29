# AMS Pro - Intelligent Inventory System

AMS Pro is a modern, web-based inventory management system with a built-in AI-powered barcode scanner. It is designed to automatically recognize products from photos, perform global API lookups, and streamline warehouse management.

## Features
- **Smart Barcode Scanning**: Uses a Triple-Engine Vision Architecture (ZXing, QuaggaJS, Tesseract OCR) to read standard, damaged, or curved barcodes directly from photos.
- **Global Product Discovery**: Automatically identifies unknown products by connecting to public databases (OpenFoodFacts, UPCItemDB) and custom web-scraping fallbacks.
- **Automated Data Entry**: Fills out product names, categories, and inventory metrics without manual typing.
- **Full CRUD Management**: Manage your inventory, suppliers, and track sales transactions.
- **MySQL Integration**: Persistent data storage with secure backend stored procedures.

## Tech Stack
- **Frontend**: HTML, Vanilla CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **AI/Vision**: Html5-Qrcode, QuaggaJS, Tesseract.js

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Harsh-2706/AMS-Pro.git
   ```

2. Install dependencies:
   ```bash
   npm install express cors body-parser mysql2
   ```

3. Setup the Database:
   - Import the `DBMS_db_updated.sql` file into your local MySQL server.
   - Update your database credentials in `db.js`.

4. Start the server:
   ```bash
   node server.js
   ```
   The application will be running live at `http://localhost:3000`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
