/**
 * AMS Pro - Final Connected App Logic (Hash-Routing Fix)
 */

const app = {
    currentUser: null,
    currentView: 'dashboard',
    html5QrCode: null,

    init: async () => {
        // Global Debug & Error Logger
        window.amsLog = (msg) => {
            console.log(msg);
            const el = document.getElementById('debug-console');
            if (el) {
                el.style.display = 'block';
                el.innerHTML += `<div>> ${new Date().toLocaleTimeString()}: ${msg}</div>`;
                el.scrollTop = el.scrollHeight;
            }
        };

        window.onerror = (msg, url, line) => {
            window.amsLog(`FATAL: ${msg} (Line: ${line})`);
            return false;
        };

        app.currentUser = window.amsApi.getCurrentUser();
        if (!app.currentUser) { app.renderLogin(); }
        else { app.renderApp(); app.navigate('dashboard'); }
        setInterval(app.updateClock, 1000);
        app.updateClock();
        if (window.amsNotifications) window.amsNotifications.init();
    },

    updateClock: () => {
        const el = document.getElementById('digital-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    },

    navigate: async (view) => {
        app.currentView = view;
        const content = document.getElementById('view-content');
        const title = document.getElementById('view-title');
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-view="${view}"]`)?.classList.add('active');
        title.textContent = view.replace('_', ' ').toUpperCase();

        content.innerHTML = `<div style="padding:4rem; text-align:center;"><div class="spin"></div></div>`;

        try {
            switch(view) {
                case 'dashboard': await app.viewDashboard(content); break;
                case 'inventory': await app.viewInventory(content); break;
                case 'suppliers': await app.viewSuppliers(content); break;
                case 'transactions': await app.viewTransactions(content); break;
                case 'logs': await app.viewLogs(content); break;
            }
        } catch (err) {
            content.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--danger);">Error connecting to Backend: ${err.message}. Ensure 'node server.js' is running.</div>`;
        }

        if (window.lucide) lucide.createIcons();
    },

    viewDashboard: async (container) => {
        const stats = await window.amsApi.getDashboardStats();
        container.innerHTML = `
            <div class="stats-grid">
                ${window.amsComponents.renderCard('Inventory Items', stats.totalItems, 'package')}
                ${window.amsComponents.renderCard('Total Revenue', `${window.CURRENCY}${stats.revenue.toLocaleString('en-IN')}`, 'trending-up', 'var(--success)')}
                ${window.amsComponents.renderCard('Stock Alerts', stats.lowStockCount, 'alert-triangle', 'var(--danger)')}
            </div>
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem;">
                <div class="card"><h3>Revenue Flow</h3><div style="height:300px;"><canvas id="mainChart"></canvas></div></div>
                <div class="card">
                    <h3>Quick Actions</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1.5rem;">
                        <button class="btn btn-primary" onclick="app.openNewSaleModal()"><i data-lucide="shopping-cart"></i> New Sale</button>
                        <button class="btn btn-ghost" onclick="app.startScanner()"><i data-lucide="scan"></i> Scan Product</button>
                    </div>
                </div>
            </div>
        `;
        app.initChart('mainChart', stats.chartData);
    },

    initChart: (id, data) => {
        const ctx = document.getElementById(id)?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, { type: 'line', data: { labels: data.labels, datasets: [{ label: 'Sales', data: data.data, borderColor: '#6366f1', tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false } });
    },

    viewInventory: async (container) => {
        const items = await window.amsApi.getItems();
        container.innerHTML = `
            <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center;">
                <input type="text" placeholder="Search SKU..." style="width:300px;" oninput="app.searchInventory(this.value)">
                <button class="btn btn-primary" onclick="app.openAddItemModal()"><i data-lucide="plus"></i> Add Item Entry</button>
            </div>
            <div id="inventory-table-root">${app.renderInventoryTable(items)}</div>
        `;
    },

    renderInventoryTable: (items) => {
        return window.amsComponents.renderTable(
            ['ID', 'SKU', 'Item Name', 'Stock', 'Price', 'Supplier'],
            items.map(i => ({ 
                id: i.item_id, 
                sku: i.sku, 
                name: `<a href="javascript:void(0)" onclick="app.openItemOverview(${i.item_id})" style="color:var(--primary); font-weight:600; text-decoration:none;">${i.item_name}</a>`, 
                stock: `<span class="badge ${i.quantity < i.min_stock_level ? 'badge-danger' : 'badge-success'}">${i.quantity} ${i.unit}</span>`,
                price: `${window.CURRENCY}${i.selling_price}`,
                sup: i.supplier_name
            })),
            (row) => `
                <button class="btn btn-icon" onclick="app.openEditItemModal(${row.id})" style="color:var(--primary);"><i data-lucide="edit-3" style="width:14px;"></i></button>
                <button class="btn btn-icon" onclick="app.deleteItem(${row.id})" style="color:var(--danger);"><i data-lucide="trash-2" style="width:14px;"></i></button>
            `
        );
    },

    viewSuppliers: async (container) => {
        const sups = await window.amsApi.getSuppliers();
        container.innerHTML = `
            <div style="margin-bottom:2rem; display:flex; justify-content:flex-end;">
                <button class="btn btn-primary" onclick="app.openAddSupplierModal()"><i data-lucide="plus"></i> Add Supplier</button>
            </div>
            ${window.amsComponents.renderTable(
                ['ID', 'Supplier Name', 'Contact', 'Location'],
                sups.map(s => ({ id: s.supplier_id, name: s.supplier_name, contact: s.contact_number, loc: s.location })),
                (row) => `
                    <button class="btn btn-icon" onclick="app.openEditSupplierModal(${row.id})" style="color:var(--primary);"><i data-lucide="edit-3" style="width:14px;"></i></button>
                    <button class="btn btn-icon" onclick="app.deleteSupplier(${row.id})" style="color:var(--danger);"><i data-lucide="trash-2" style="width:14px;"></i></button>
                `
            )}
        `;
    },

    viewTransactions: async (container) => {
        const txs = await window.amsApi.getTransactions();
        container.innerHTML = window.amsComponents.renderTable(
            ['TX_ID', 'Item ID', 'Qty', 'Total', 'Date'],
            txs.map(t => ({ 
                id: t.transaction_id, 
                item: t.item_id, 
                qty: t.quantity_sold, 
                amt: `${window.CURRENCY}${t.total_amount}`, 
                date: new Date(t.transaction_date).toLocaleString() 
            }))
        );
    },

    viewLogs: async (container) => {
        const invLogs = await window.amsApi.getInventoryLogs();
        const supLogs = await window.amsApi.getSupplierLogs();
        const userLogs = await window.amsApi.getUserLogs();
        
        container.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr; gap:2rem;">
                <div class="card">
                    <h3>Inventory Audit Trail</h3>
                    ${window.amsComponents.renderTable(
                        ['Log ID', 'Item', 'Change Type', 'Qty Change', 'Date'],
                        invLogs.map(l => ({ 
                            id: l.log_id, 
                            item: l.item_name, 
                            type: `<span class="badge ${l.change_type === 'ADD' ? 'badge-success' : 'badge-primary'}">${l.change_type}</span>`, 
                            qty: l.quantity_change, 
                            date: new Date(l.log_date).toLocaleString() 
                        }))
                    )}
                </div>
                <div class="card">
                    <h3>Supplier Change Logs</h3>
                    ${window.amsComponents.renderTable(
                        ['Log ID', 'Supplier', 'Change Type', 'Date'],
                        supLogs.map(l => ({ 
                            id: l.log_id, 
                            sup: l.supplier_name, 
                            type: `<span class="badge badge-primary">${l.change_type}</span>`, 
                            date: new Date(l.log_date).toLocaleString() 
                        }))
                    )}
                </div>
                <div class="card">
                    <h3>User Access Logs</h3>
                    ${window.amsComponents.renderTable(
                        ['Log ID', 'User', 'Login Time'],
                        userLogs.map(l => ({ 
                            id: l.log_id, 
                            user: `${l.first_name} ${l.last_name}`, 
                            date: new Date(l.login_time).toLocaleString() 
                        }))
                    )}
                </div>
            </div>
        `;
    },

    // --- High-Sensitivity Vision System ---
    startScanner: () => {
        if (typeof Html5Qrcode === 'undefined') {
            window.amsLog("ERROR: Scanning library (Html5Qrcode) not loaded yet.");
            alert("Scanner library is still loading. Please wait 2 seconds and try again.");
            return;
        }

        app.showModal('AMS PRO Vision: High-Sensitivity Mode', `
            <div id="scanner-container" style="position:relative; width:100%; border-radius:12px; overflow:hidden; background:#000; border:2px solid var(--primary);">
                <div id="reader" style="width:100%; height:420px;"></div>
                <div style="position:absolute; top:1rem; right:1rem; background:rgba(0,0,0,0.6); padding:0.5rem 0.75rem; border-radius:6px; color:#fff; font-size:0.75rem; font-weight:700; z-index:10;">
                    <span id="scan-status">📡 WIDE-ANGLE ACTIVE</span>
                </div>
            </div>
            <div style="margin-top:1.5rem; text-align:center; display:flex; flex-direction:column; gap:1rem;">
                <p style="color:var(--text-muted); font-size:0.875rem;">
                    <b>Laptop Tip:</b> Hold the barcode about 15-20cm away. Don't get too close or it will blur.
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                    <label class="btn btn-ghost" style="cursor:pointer; font-size:0.75rem;">
                        <i data-lucide="image"></i> Upload Photo
                        <input type="file" id="barcode-upload" accept="image/*" style="display:none;" onchange="app.handleFileUpload(this)">
                    </label>
                    <button class="btn btn-ghost" onclick="app.processScanResult(prompt('Enter SKU manually:'))" style="font-size:0.75rem;">
                        <i data-lucide="keyboard"></i> Type SKU
                    </button>
                </div>
            </div>
        `);
        
        if (window.lucide) lucide.createIcons();

        app.stopScanner();
        setTimeout(() => {
            const readerEl = document.getElementById('reader');
            if (!readerEl) return;
            
            app.html5QrCode = new Html5Qrcode("reader");
            // Full-frame scanning is better for laptop cameras that can't focus close
            const config = { 
                fps: 20, 
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    return { width: viewfinderWidth * 0.8, height: viewfinderHeight * 0.4 };
                },
                aspectRatio: 1.0
            };

            app.html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                (sku) => {
                    window.amsLog(`STABLE SCAN: ${sku}`);
                    const sound = document.getElementById('alert-sound');
                    if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }
                    app.stopScanner();
                    app.processScanResult(sku.trim());
                }
            ).catch(err => window.amsLog("HARDWARE_ERR: " + err));
        }, 500);
    },

    handleFileUpload: (input) => {
        if (!input.files || input.files.length === 0) return;
        window.amsLog("Starting AI Image Pre-processing...");
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Single scanner instance for all passes
                const scanner = new Html5Qrcode("reader", {
                    formatsToSupport: [ 
                        Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E
                    ]
                });

                const attempts = [
                    { contrast: 1.0, brightness: 1.0, scale: 1.0, invert: false, rotate: 0,   crop: false, sniperOCR: false }, 
                    { contrast: 1.8, brightness: 1.2, scale: 1.5, invert: false, rotate: 0,   crop: true,  sniperOCR: false }, 
                    { contrast: 1.0, brightness: 1.0, scale: 1.0, invert: false, rotate: 90,  crop: false, sniperOCR: false }, // Horizontal check
                    { contrast: 1.5, brightness: 1.5, scale: 1.0, invert: true,  rotate: 0,   crop: false, sniperOCR: false },
                    { sniperOCR: true } 
                ];

                for (const pass of attempts) {
                    window.amsLog(`Pass: Con:${pass.contrast || 1} Rot:${pass.rotate || 0} Crop:${pass.crop}`);
                    
                    if (pass.crop) {
                        const sw = img.width * 0.6;
                        const sh = img.height * 0.4;
                        const sx = (img.width - sw) / 2;
                        const sy = (img.height - sh) / 2;
                        canvas.width = sw * pass.scale;
                        canvas.height = sh * pass.scale;
                        ctx.filter = `grayscale(100%) contrast(${pass.contrast * 100}%) brightness(${pass.brightness * 100}%)`;
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                    } else if (pass.sniperOCR) {
                        const sw = img.width * 0.8;
                        const sh = img.height * 0.2;
                        const sx = img.width * 0.1;
                        const sy = img.height * 0.7;
                        canvas.width = sw * 2;
                        canvas.height = sh * 2;
                        ctx.filter = `grayscale(100%) contrast(300%) brightness(150%)`;
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                    } else if (pass.rotate) {
                        // Rotation Support for Vertical Barcodes (like Maggi)
                        canvas.width = img.height;
                        canvas.height = img.width;
                        ctx.save();
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(pass.rotate * Math.PI / 180);
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                        ctx.restore();
                    } else {
                        canvas.width = img.width * pass.scale;
                        canvas.height = img.height * pass.scale;
                        ctx.filter = `grayscale(100%) contrast(${pass.contrast * 100}%) brightness(${pass.brightness * 100}%) ${pass.invert ? 'invert(100%)' : ''}`;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                    
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        const processedBlob = await (await fetch(dataUrl)).blob();
                        const pFile = new File([processedBlob], "p.jpg");
                        
                        if (!pass.sniperOCR) {
                            const scanner = new Html5Qrcode("reader");
                            const sku = await scanner.scanFile(pFile, true);
                            window.amsLog(`ENGINE_ZXING MATCH: ${sku}`);
                            app.stopScanner();
                            app.processScanResult(sku.trim());
                            return;
                        } else {
                            window.amsLog("Running Sniper OCR on digit-zone...");
                            const { data: { text } } = await Tesseract.recognize(canvas.toDataURL(), 'eng');
                            const match = text.replace(/\s/g, '').match(/\d{13}/);
                            if (match) {
                                window.amsLog(`SNIPER_OCR MATCH: ${match[0]}`);
                                app.stopScanner();
                                app.processScanResult(match[0]);
                                return;
                            }
                        }
                    } catch (err) { 
                        if (!pass.sniperOCR) {
                            try {
                                const res = await new Promise((resolve, reject) => {
                                    Quagga.decodeSingle({
                                        src: canvas.toDataURL(),
                                        numOfWorkers: 0,
                                        decoder: { readers: ["ean_reader", "code_128_reader", "upc_reader"] },
                                        locate: true
                                    }, (result) => {
                                        if (result && result.codeResult) resolve(result.codeResult.code);
                                        else reject();
                                    });
                                });
                                window.amsLog(`ENGINE_QUAGGA MATCH: ${res}`);
                                app.stopScanner();
                                app.processScanResult(res.trim());
                                return;
                            } catch (qErr) { }
                        }
                    }
                }
                
                window.amsLog("PRE-PROCESS_FAIL: All engines (AI + OCR) failed.");
                alert("Could not identify product. Please type the SKU manually using 'Type SKU'.");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    processScanResult: async (sku) => {
        if (!sku) return;
        const items = await window.amsApi.getItems();
        const item = items.find(i => i.sku === sku);
        
        if (item) {
            // Product exists -> Add Stock
            app.showModal(`Update Stock: ${item.item_name}`, `
                <div class="card" style="margin-bottom:1.5rem; background:var(--bg-secondary); border:1px solid var(--primary);">
                    <p style="font-size:0.875rem; color:var(--text-muted);">Current Quantity</p>
                    <p style="font-size:1.5rem; font-weight:800;">${item.quantity} ${item.unit}</p>
                </div>
                <form id="form-stock-update">
                    <div class="form-group"><label>Units to Add</label><input type="number" name="add_qty" value="1" min="1" required></div>
                </form>
            `, `<button class="btn btn-primary" onclick="app.submitStockUpdate(${item.item_id}, '${item.item_name}')">Finalize Batch Addition</button>`);
        } else {
            // New Product -> Smart Discovery Mode
            window.amsLog(`Starting Global API Discovery for SKU: ${sku}`);
            const sups = await window.amsApi.getSuppliers();
            
            let discoveredName = "";
            let discoveredCat = "";
            let discoveredCost = "";
            let discoveredSell = "";
            let discoveredUnit = "units";
            let apiStatusMsg = "Searching global product databases...";

            try {
                // Try 1: OpenFoodFacts API (Great for Groceries/FMCG)
                window.amsLog(`Fetching data from OpenFoodFacts for ${sku}...`);
                const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${sku}.json`);
                let found = false;

                if (offRes.ok) {
                    const offData = await offRes.json();
                    if (offData.status === 1 && offData.product) {
                        discoveredName = offData.product.product_name || "Unknown Name";
                        discoveredCat = offData.product.categories ? offData.product.categories.split(',')[0].trim() : "General";
                        apiStatusMsg = `✨ <b>Global API Success:</b> Product fetched from OpenFoodFacts.`;
                        window.amsLog(`OFF API SUCCESS: Found ${discoveredName}`);
                        found = true;
                    }
                }

                // Try 2: UPCItemDB (Great for Electronics/General Retail)
                if (!found) {
                    window.amsLog(`Not in OFF. Trying UPCItemDB for ${sku}...`);
                    const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${sku}`);
                    if (upcRes.ok) {
                        const upcData = await upcRes.json();
                        if (upcData.code === "OK" && upcData.items && upcData.items.length > 0) {
                            discoveredName = upcData.items[0].title || "Unknown Name";
                            discoveredCat = upcData.items[0].category ? upcData.items[0].category.split('>').pop().trim() : "General";
                            apiStatusMsg = `✨ <b>Global API Success:</b> Product fetched from UPCItemDB.`;
                            window.amsLog(`UPC API SUCCESS: Found ${discoveredName}`);
                            found = true;
                        }
                    }
                }

                // Try 3: Custom Backend Web Scraper Proxy (Ultimate Fallback)
                if (!found) {
                    window.amsLog(`Not in APIs. Attempting Deep Web Scrape for ${sku}...`);
                    const scrapeRes = await fetch(`/api/scrape/${sku}`);
                    if (scrapeRes.ok) {
                        const scrapeData = await scrapeRes.json();
                        if (scrapeData.success && scrapeData.title) {
                            // Extract just a reasonable length title from the snippet
                            discoveredName = scrapeData.title.substring(0, 60) + "...";
                            discoveredCat = "General";
                            apiStatusMsg = `✨ <b>Web Scrape Success:</b> Product name extracted from public search engines.`;
                            window.amsLog(`SCRAPE SUCCESS: Found ${discoveredName}`);
                            found = true;
                        }
                    }
                }

                if (!found) throw new Error("Not found in any database or search engine.");

            } catch (err) {
                window.amsLog(`API FAIL: ${err.message}`);
                apiStatusMsg = `ℹ️ <b>Unrecognized Product:</b> Not found in public databases or web search. <a href="https://www.google.com/search?q=${sku}" target="_blank" style="color:var(--primary); font-weight:bold; text-decoration:underline;">Click here to search Google for "${sku}"</a>`;
            }

            app.showModal(`New Product Detected: ${sku}`, `
                <div style="padding:1rem; background:rgba(99,102,241,0.1); border-radius:8px; margin-bottom:1.5rem; border-left:4px solid var(--primary);">
                    ${apiStatusMsg}
                </div>
                ${window.amsComponents.renderItemForm({ 
                    sku, 
                    item_name: discoveredName, 
                    category: discoveredCat,
                    cost_price: discoveredCost,
                    selling_price: discoveredSell,
                    unit: discoveredUnit,
                    quantity: 1,
                    min_stock_level: 5
                }, sups)}
            `, `<button class="btn btn-primary" onclick="app.submitItem()">Register New Product</button>`);
        }
    },

    submitStockUpdate: async (id, name) => {
        const qty = parseInt(document.querySelector('[name="add_qty"]').value);
        // We use the updateItem API or a specific increment API
        const items = await window.amsApi.getItems();
        const item = items.find(i => i.item_id === id);
        const newQty = item.quantity + qty;
        
        const res = await window.amsApi.updateItem(id, { ...item, quantity: newQty });
        if (res.success) {
            window.amsNotifications.show('Inventory Updated', `Added ${qty} units to ${name}.`);
            app.closeModal();
            app.navigate('inventory');
        }
    },

    stopScanner: () => { 
        // 1. Stop HTML5-QRCode
        try {
            if(app.html5QrCode) {
                app.html5QrCode.stop().catch(() => {}).finally(() => {
                    try { app.html5QrCode.clear(); } catch(e) {}
                    app.html5QrCode = null;
                });
            }
        } catch (e) { window.amsLog("Scanner Cleanup Error: " + e.message); }

        // 2. Stop QuaggaJS
        try {
            if (typeof Quagga !== 'undefined') {
                Quagga.stop();
            }
        } catch (e) {}
    },

    // --- CRUD with Backend Handlers ---
    submitItem: async () => {
        const formEl = document.getElementById('form-item-crud');
        if (!formEl) {
            window.amsLog("FATAL: Registration form not found in DOM.");
            return;
        }
        const d = Object.fromEntries(new FormData(formEl));
        window.amsLog(`Registering SKU: ${d.sku}...`);
        const res = await window.amsApi.addItem(d);
        if (res.success) { 
            window.amsNotifications.show('Success', 'Item registered via SQL Procedure.');
            app.closeModal(); 
            app.navigate('inventory'); 
        }
        else window.amsNotifications.show('Error', res.message, 'danger');
    },

    submitSupplier: async () => {
        const d = Object.fromEntries(new FormData(document.getElementById('form-add-supplier')));
        const res = await window.amsApi.addSupplier(d);
        if (res.success) {
            window.amsNotifications.show('Success', 'Supplier added to MySQL.');
            app.closeModal();
            app.navigate('suppliers');
        } else window.amsNotifications.show('Error', res.message, 'danger');
    },

    openEditItemModal: async (id) => {
        const items = await window.amsApi.getItems();
        const sups = await window.amsApi.getSuppliers();
        const item = items.find(i => i.item_id === id);
        app.showModal('Edit Item Details', window.amsComponents.renderItemForm(item, sups), `<button class="btn btn-primary" onclick="app.submitItemEdit(${id})">Save Changes</button>`);
    },

    submitItemEdit: async (id) => {
        const d = Object.fromEntries(new FormData(document.getElementById('form-item-crud')));
        const res = await window.amsApi.updateItem(id, d);
        if (res.success) { app.closeModal(); app.navigate('inventory'); }
        else alert(res.message);
    },

    openEditSupplierModal: async (id) => {
        const sups = await window.amsApi.getSuppliers();
        const sup = sups.find(s => s.supplier_id === id);
        app.showModal('Edit Supplier Info', window.amsComponents.renderSupplierForm(sup), `<button class="btn btn-primary" onclick="app.submitSupplierEdit(${id})">Update Supplier</button>`);
    },

    submitSupplierEdit: async (id) => {
        const d = Object.fromEntries(new FormData(document.getElementById('form-supplier-crud')));
        const res = await window.amsApi.updateSupplier(id, d);
        if (res.success) { app.closeModal(); app.navigate('suppliers'); }
        else alert(res.message);
    },

    openItemOverview: async (id) => {
        const items = await window.amsApi.getItems();
        const item = items.find(i => i.item_id === id);
        const profit = item.selling_price - item.cost_price;
        
        app.showModal(`Product Overview: ${item.item_name}`, `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <div class="card" style="background:var(--bg-secondary);">
                    <p style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.25rem;">SKU ID</p>
                    <p style="font-weight:700; font-size:1.125rem;">${item.sku}</p>
                </div>
                <div class="card" style="background:var(--bg-secondary);">
                    <p style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.25rem;">Category</p>
                    <p style="font-weight:700; font-size:1.125rem;">${item.category}</p>
                </div>
            </div>
            <div style="margin-top:1.5rem; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; text-align:center;">
                <div><p style="color:var(--text-muted); font-size:0.7rem;">COST</p><p style="font-weight:600;">${window.CURRENCY}${item.cost_price}</p></div>
                <div><p style="color:var(--text-muted); font-size:0.7rem;">SELL</p><p style="font-weight:600;">${window.CURRENCY}${item.selling_price}</p></div>
                <div><p style="color:var(--text-muted); font-size:0.7rem;">PROFIT/UNIT</p><p style="font-weight:600; color:var(--success);">+${window.CURRENCY}${profit}</p></div>
            </div>
            <hr style="border:0; border-top:1px solid var(--border); margin:1.5rem 0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <p style="color:var(--text-muted); font-size:0.875rem;">Current Inventory Status</p>
                    <p style="font-size:1.5rem; font-weight:800; margin-top:0.25rem;">${item.quantity} <span style="font-size:0.875rem; font-weight:400; color:var(--text-muted);">${item.unit}</span></p>
                </div>
                <div style="text-align:right;">
                    <p style="color:var(--text-muted); font-size:0.875rem;">Minimum Threshold</p>
                    <p style="font-size:1.25rem; font-weight:600; color:var(--danger);">${item.min_stock_level} ${item.unit}</p>
                </div>
            </div>
        `, `<button class="btn btn-ghost" onclick="app.closeModal()">Close Details</button>`);
    },

    openNewSaleModal: async (preSelectedId = null) => {
        const items = await window.amsApi.getItems();
        app.showModal('Process Sale Transaction', `
            <form id="form-sale">
                <div class="form-group"><label>Product</label>
                <select name="item_id" style="width:100%; padding:0.75rem;">
                    ${items.map(i => `<option value="${i.item_id}" ${preSelectedId == i.item_id ? 'selected' : ''}>${i.item_name} (Avail: ${i.quantity} ${i.unit})</option>`).join('')}
                </select></div>
                <div class="form-group"><label>Quantity</label><input type="number" name="quantity_sold" value="1" required></div>
            </form>
        `, `<button class="btn btn-primary" onclick="app.submitSale()">Complete Transaction</button>`);
    },

    submitSale: async () => {
        const d = Object.fromEntries(new FormData(document.getElementById('form-sale')));
        const res = await window.amsApi.addTransaction(d);
        if (res.success) { 
            app.closeModal(); 
            app.navigate('transactions'); 
            window.amsNotifications.show('Success', 'Inventory updated in MySQL.');
        } else {
            window.amsNotifications.show('Error', res.message);
        }
    },

    deleteItem: async (id) => { if(confirm('Delete item?')) { await window.amsApi.deleteItem(id); app.navigate('inventory'); } },
    deleteSupplier: async (id) => { if(confirm('Delete supplier?')) { await window.amsApi.deleteSupplier(id); app.navigate('suppliers'); } },

    // --- Modals ---
    openAddItemModal: async () => {
        const sups = await window.amsApi.getSuppliers();
        app.showModal('Add Item (SQL PROCEDURE)', `
            <form id="form-add-item">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="form-group"><label>SKU</label><input type="text" name="sku" required></div>
                    <div class="form-group"><label>Name</label><input type="text" name="item_name" required></div>
                    <div class="form-group"><label>Category</label><input type="text" name="category" required></div>
                    <div class="form-group"><label>Unit</label><input type="text" name="unit" required></div>
                    <div class="form-group"><label>Cost</label><input type="number" name="cost_price" required></div>
                    <div class="form-group"><label>Sell</label><input type="number" name="selling_price" required></div>
                    <div class="form-group"><label>Stock</label><input type="number" name="quantity" required></div>
                    <div class="form-group"><label>Min Level</label><input type="number" name="min_stock_level" required></div>
                    <div class="form-group"><label>Discount (%)</label><input type="number" name="discount" value="0"></div>
                    <div class="form-group"><label>Supplier</label>
                    <select name="supplier_id" style="width:100%; padding:0.75rem;">${sups.map(s => `<option value="${s.supplier_id}">${s.supplier_name}</option>`).join('')}</select></div>
                </div>
            </form>
        `, `<button class="btn btn-primary" onclick="app.submitItem()">Execute Procedure</button>`);
    },

    openAddSupplierModal: () => {
        app.showModal('Add Supplier', `
            <form id="form-add-supplier">
                <div class="form-group"><label>Name</label><input type="text" name="supplier_name" required></div>
                <div class="form-group"><label>Contact</label><input type="text" name="contact_number" required></div>
                <div class="form-group"><label>Email</label><input type="email" name="email"></div>
                <div class="form-group"><label>Location</label><input type="text" name="location" required></div>
            </form>
        `, `<button class="btn btn-primary" onclick="app.submitSupplier()">Save to MySQL</button>`);
    },

    // --- Core Layout ---
    // --- Core Layout ---
    renderApp: () => {
        const u = app.currentUser;
        document.getElementById('app').innerHTML = `
            <aside class="sidebar">
                <div class="logo"><i data-lucide="shield-check"></i> AMS PRO</div>
                <nav class="nav-links">
                    <a class="nav-link" onclick="app.navigate('dashboard')" data-view="dashboard"><i data-lucide="layout-dashboard"></i> Dashboard</a>
                    <a class="nav-link" onclick="app.navigate('inventory')" data-view="inventory"><i data-lucide="boxes"></i> Inventory</a>
                    <a class="nav-link" onclick="app.navigate('suppliers')" data-view="suppliers"><i data-lucide="truck"></i> Suppliers</a>
                    <a class="nav-link" onclick="app.navigate('transactions')" data-view="transactions"><i data-lucide="shopping-cart"></i> Sales</a>
                    <a class="nav-link" onclick="app.navigate('logs')" data-view="logs"><i data-lucide="history"></i> System Logs</a>
                </nav>
                <div style="margin-top:auto;"><a class="nav-link" onclick="app.logout()" style="color:#fca5a5;"><i data-lucide="log-out"></i> Logout</a></div>
            </aside>
            <main class="main-content">
                <header>
                    <h2 id="view-title">Dashboard</h2>
                    <div class="header-right">
                        <div class="clock-badge" id="digital-clock">00:00:00 AM</div>
                        <div class="profile-section">
                            <div class="profile-info"><span class="profile-name">${u.first_name} ${u.last_name}</span><span class="profile-role">DB ADMIN</span></div>
                            <div class="avatar">${u.first_name[0]}</div>
                        </div>
                    </div>
                </header>
                <div id="view-content"></div>
            </main>
            <div id="modal-root" class="modal-overlay"></div>
            <div id="debug-console" style="position:fixed; bottom:0; right:0; width:340px; height:200px; background:rgba(15,23,42,0.95); color:#22c55e; font-family:'JetBrains Mono', monospace; font-size:11px; overflow-y:auto; z-index:99999; padding:10px; display:none; border:1px solid #334155; box-shadow:0 -4px 20px rgba(0,0,0,0.5); border-radius:12px 0 0 0;">
                <div style="border-bottom:1px solid #334155; margin-bottom:5px; padding-bottom:5px; font-weight:800; display:flex; justify-content:space-between;">
                    <span>SYSTEM ANALYTICS & LOGS</span>
                    <span onclick="this.parentElement.parentElement.style.display='none'" style="cursor:pointer; color:#ef4444;">[X]</span>
                </div>
            </div>
        `;
    },

    renderLogin: () => {
        // Ensure URL stays at root, never /login
        if (window.location.pathname !== '/') {
            window.history.replaceState({}, '', '/');
        }
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h2 style="text-align:center; margin-bottom:2.5rem; font-weight:800;">AMS PRO Login</h2>
                    <form id="login-form">
                        <div class="form-group"><label>Email</label><input type="email" id="login-email" value="rahul@gmail.com"></div>
                        <div class="form-group"><label>Password</label><input type="password" id="login-pass" value="password123"></div>
                        <button type="button" id="login-btn" class="btn btn-primary" style="width:100%; justify-content:center;">Connect to Server</button>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('login-btn').addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            app.login(email, pass);
        });
    },

    login: async (email, password) => {
        window.amsLog(`Attempting login for ${email}...`);
        const res = await window.amsApi.login(email, password);
        if (res.success) { 
            window.amsLog('Login Successful.');
            app.currentUser = res.user; 
            app.renderApp(); 
            app.navigate('dashboard'); 
        } else {
            window.amsLog(`Login Failed: ${res.message}`);
            alert(`Login Failed: ${res.message}`);
        }
    },

    logout: async () => { await window.amsApi.logout(); location.reload(); },
    showModal: (t, c, f) => { const r = document.getElementById('modal-root'); r.innerHTML = window.amsComponents.renderModal(t, c, f); r.style.display = 'flex'; if (window.lucide) lucide.createIcons(); },
    closeModal: () => { 
        try {
            app.stopScanner(); 
            const root = document.getElementById('modal-root');
            if (root) root.style.display = 'none';
        } catch (e) {
            window.amsLog("Modal Close Error: " + e.message);
            const root = document.getElementById('modal-root');
            if (root) root.style.display = 'none';
        }
    },
    searchInventory: async (q) => { const items = await window.amsApi.getItems(); const f = items.filter(i => i.item_name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase())); document.getElementById('inventory-table-root').innerHTML = app.renderInventoryTable(f); if (window.lucide) lucide.createIcons(); }
};

window.app = app;
document.addEventListener('DOMContentLoaded', app.init);
