/**
 * Robust Notification Engine for AMS Pro
 */

const notifications = {
    permission: 'default',

    init: async () => {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notifications");
            return;
        }

        notifications.permission = Notification.permission;
        
        if (notifications.permission === 'default') {
            const status = await Notification.requestPermission();
            notifications.permission = status;
        }
    },

    show: (title, body) => {
        // 1. Play Sound
        const sound = document.getElementById('alert-sound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn("Audio blocked by browser policy"));
        }

        // 2. Browser Notification
        if (notifications.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png'
            });
        }

        // 3. Fallback In-App Alert (Custom Toast)
        notifications.showToast(title, body);
    },

    showToast: (title, body) => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:12px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: #1e293b; color: #fff; padding: 1rem 1.5rem; border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-left: 4px solid #6366f1;
            min-width: 300px; animation: slideIn 0.3s ease-out; cursor: pointer;
        `;
        toast.innerHTML = `
            <div style="font-weight:700; font-size:0.875rem; margin-bottom:0.25rem;">${title}</div>
            <div style="font-size:0.75rem; opacity:0.8;">${body}</div>
        `;

        toast.onclick = () => toast.remove();
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = '0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// Add CSS for toast animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);

window.amsNotifications = notifications;
