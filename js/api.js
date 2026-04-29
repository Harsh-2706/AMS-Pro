/**
 * AMS Pro - MySQL-Connected API Layer
 */

const BASE_URL = '/api';

const api = {
    // --- Items ---
    getItems: async () => {
        const res = await fetch(`${BASE_URL}/items`);
        return await res.json();
    },

    addItem: async (data) => {
        const res = await fetch(`${BASE_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateItem: async (id, data) => {
        const res = await fetch(`${BASE_URL}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteItem: async (id) => {
        const res = await fetch(`${BASE_URL}/items/${id}`, { method: 'DELETE' });
        return await res.json();
    },

    // --- Suppliers ---
    getSuppliers: async () => {
        const res = await fetch(`${BASE_URL}/suppliers`);
        return await res.json();
    },

    addSupplier: async (data) => {
        const res = await fetch(`${BASE_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateSupplier: async (id, data) => {
        const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteSupplier: async (id) => {
        const res = await fetch(`${BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
        return await res.json();
    },

    // --- Transactions (Sale) ---
    getTransactions: async () => {
        const res = await fetch(`${BASE_URL}/transactions`);
        return await res.json();
    },

    addTransaction: async (data) => {
        const res = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    // --- Analytics ---
    getDashboardStats: async () => {
        const res = await fetch(`${BASE_URL}/dashboard/stats`);
        return await res.json();
    },

    getProductAnalytics: async (id) => {
        const items = await api.getItems();
        const item = items.find(i => i.item_id === id);
        return { item, totalSold: 15, revenue: 750 }; // Basic summary
    },

    // --- Logs ---
    getInventoryLogs: async () => {
        const res = await fetch(`${BASE_URL}/logs/inventory`);
        return await res.json();
    },

    getSupplierLogs: async () => {
        const res = await fetch(`${BASE_URL}/logs/suppliers`);
        return await res.json();
    },

    getUserLogs: async () => {
        const res = await fetch(`${BASE_URL}/logs/user`);
        return await res.json();
    },

    // --- Auth (Connected) ---
    getCurrentUser: () => JSON.parse(localStorage.getItem('ams_current_user')),
    getCurrentLogId: () => localStorage.getItem('ams_log_id'),
    
    login: async (email, password) => {
        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('ams_current_user', JSON.stringify(data.user));
                localStorage.setItem('ams_log_id', data.logId);
                return { success: true, user: data.user };
            }
            return data;
        } catch(e) {
            return { success: false, message: "Authentication Server Offline" };
        }
    },
    
    logout: async () => {
        const logId = api.getCurrentLogId();
        try {
            await fetch(`${BASE_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId })
            });
        } catch(e) {}
        localStorage.removeItem('ams_current_user');
        localStorage.removeItem('ams_log_id');
    }
};

window.amsApi = api;
window.CURRENCY = '₹';
