/**
 * user-store.js  —  Per-user scoped localStorage
 *
 * Every key is stored as  "alz:{userEmail}:{dataName}"
 * so Jane's data and Srinjayi's data never overwrite each other,
 * even on the same browser.  Each user always gets their own data back.
 */
(function (global) {
    'use strict';

    function getUserKey() {
        try {
            var u = localStorage.getItem('user');
            if (!u) return 'guest';
            var p = JSON.parse(u);
            return (p.email || p.username || p.id || 'guest')
                .toLowerCase().replace(/[^a-z0-9@._+-]/g, '_');
        } catch (e) { return 'guest'; }
    }

    function sk(name) { return 'alz:' + getUserKey() + ':' + name; }

    var UserStore = {
        get: function (name, fallback) {
            try {
                var raw = localStorage.getItem(sk(name));
                if (raw === null) return (fallback !== undefined ? fallback : null);
                return JSON.parse(raw);
            } catch (e) { return (fallback !== undefined ? fallback : null); }
        },
        set: function (name, value) {
            try { localStorage.setItem(sk(name), JSON.stringify(value)); return true; }
            catch (e) { return false; }
        },
        remove: function (name) {
            try { localStorage.removeItem(sk(name)); } catch (e) {}
        },
        /**
         * Called once right after login.
         * If the user has old unscoped data (from before this fix),
         * move it into their scoped namespace so they don't lose it.
         */
        migrateOldData: function () {
            ['profileData','medicalData','userReports','journalEntries','memories','reminders'].forEach(function (name) {
                if (!localStorage.getItem(sk(name))) {
                    var old = localStorage.getItem(name);
                    if (old) localStorage.setItem(sk(name), old);
                }
            });
        },
        userKey: getUserKey
    };

    global.UserStore = UserStore;
})(window);
