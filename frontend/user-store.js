/**
 * user-store.js  —  Per-user local cache (fallback when offline)
 *
 * Keys are scoped by user email:  "alz:{email}:{dataName}"
 * so multiple accounts on the same browser never mix data.
 *
 * The BACKEND (Neon DB) is the source of truth for profile & reports.
 * This cache is used for:
 *   - Instant page loads (no waiting for API)
 *   - Offline resilience
 */
(function (global) {
    'use strict';

    function userKey() {
        try {
            var u = localStorage.getItem('user');
            if (!u) return 'guest';
            var p = JSON.parse(u);
            return (p.email || p.username || p.id || 'guest')
                .toLowerCase().replace(/[^a-z0-9@._+-]/g, '_');
        } catch (e) { return 'guest'; }
    }

    function sk(name) { return 'alz:' + userKey() + ':' + name; }

    global.UserStore = {
        get: function (name, fallback) {
            try {
                var raw = localStorage.getItem(sk(name));
                if (raw === null) return fallback !== undefined ? fallback : null;
                return JSON.parse(raw);
            } catch (e) { return fallback !== undefined ? fallback : null; }
        },
        set: function (name, value) {
            try { localStorage.setItem(sk(name), JSON.stringify(value)); }
            catch (e) { console.warn('UserStore.set failed', e); }
        },
        remove: function (name) {
            try { localStorage.removeItem(sk(name)); } catch (e) {}
        },
        userKey: userKey
    };

})(window);
