/**
 * AMS Pro - Interactive CRUD Components
 */

const components = {
    renderCard: (title, value, icon, color = 'var(--primary)') => `
        <div class="card stat-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="stat-label">${title}</span>
                <i data-lucide="${icon}" style="color:${color}; width:18px; height:18px;"></i>
            </div>
            <div class="stat-value">${value}</div>
        </div>
    `,

    renderTable: (headers, rows, actionsFn = null) => `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                        ${actionsFn ? '<th style="text-align:right; padding-right:2rem;">Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows.map(row => `
                        <tr>
                            ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
                            ${actionsFn ? `<td style="text-align:right; padding-right:1rem;">${actionsFn(row)}</td>` : ''}
                        </tr>
                    `).join('') : '<tr><td colspan="100%" style="text-align:center; padding:2rem; color:var(--text-muted);">No records found</td></tr>'}
                </tbody>
            </table>
        </div>
    `,

    renderModal: (title, content, footer = '') => `
        <div class="modal" style="max-width: 800px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h3 style="font-size:1.125rem; font-weight:700;">${title}</h3>
                <button class="btn btn-ghost" onclick="app.closeModal()" style="padding:0.25rem; border-radius:50%;"><i data-lucide="x" style="width:18px;"></i></button>
            </div>
            <div class="modal-content">${content}</div>
            ${footer ? `<div class="modal-footer" style="margin-top:2rem; display:flex; justify-content:flex-end; gap:1rem;">${footer}</div>` : ''}
        </div>
    `,

    // Pre-filled forms for Editing
    renderItemForm: (item = null, sups = []) => `
        <form id="form-item-crud">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group"><label>SKU</label><input type="text" name="sku" value="${item?.sku || ''}" required></div>
                <div class="form-group"><label>Item Name</label><input type="text" name="item_name" value="${item?.item_name || ''}" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group"><label>Category</label><input type="text" name="category" value="${item?.category || ''}" required></div>
                <div class="form-group"><label>Unit</label><input type="text" name="unit" value="${item?.unit || ''}" placeholder="kg/units/litre" required></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                <div class="form-group"><label>Cost (₹)</label><input type="number" name="cost_price" value="${item?.cost_price || ''}" required></div>
                <div class="form-group"><label>Sell (₹)</label><input type="number" name="selling_price" value="${item?.selling_price || ''}" required></div>
                <div class="form-group"><label>Discount (%)</label><input type="number" name="discount" value="${item?.discount || 0}"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                <div class="form-group"><label>Stock</label><input type="number" name="quantity" value="${item?.quantity || ''}" required></div>
                <div class="form-group"><label>Min Level</label><input type="number" name="min_stock_level" value="${item?.min_stock_level || ''}" required></div>
                <div class="form-group"><label>Supplier</label>
                    <select name="supplier_id" style="width:100%; padding:0.75rem;">
                        ${sups.map(s => `<option value="${s.supplier_id}" ${item?.supplier_id === s.supplier_id ? 'selected' : ''}>${s.supplier_name}</option>`).join('')}
                    </select>
                </div>
            </div>
        </form>
    `,

    renderSupplierForm: (sup = null) => `
        <form id="form-supplier-crud">
            <div class="form-group"><label>Supplier Name</label><input type="text" name="supplier_name" value="${sup?.supplier_name || ''}" required></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group"><label>Contact Number</label><input type="text" name="contact_number" value="${sup?.contact_number || ''}" required></div>
                <div class="form-group"><label>Email</label><input type="email" name="email" value="${sup?.email || ''}"></div>
            </div>
            <div class="form-group"><label>Location</label><input type="text" name="location" value="${sup?.location || ''}" required></div>
        </form>
    `
};

window.amsComponents = components;
