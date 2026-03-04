/**
 * api.js  —  Frontend API helper
 *
 * Security update: JWT is now stored in an httpOnly cookie set by the server.
 * The browser sends the cookie automatically — we no longer read or send tokens
 * from localStorage. All fetch calls include  credentials: 'include'  so the
 * browser attaches the cookie to every cross-origin request.
 *
 * Render cold-start handling is unchanged: automatic retry with status bar.
 *
 * Usage:
 *   const res  = await API.post('/auth/signin', { email, password });
 *   const data = await res.json();
 *
 *   const res  = await API.get('/profile');
 *   const data = await res.json();
 *
 *   await API.logout();   // clears cookie server-side and redirects to login
 */
(function (global) {
    'use strict';

    const BASE        = 'https://alzheimer-backend-new.onrender.com/api';
    const TIMEOUT_MS  = 40000;   // 40 s — Render cold start can take ~30 s
    const MAX_RETRIES = 2;

    function showBar(msg, type) {
        var bar = document.getElementById('_apiBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = '_apiBar';
            Object.assign(bar.style, {
                position:'fixed', top:'0', left:'0', right:'0', zIndex:'999999',
                textAlign:'center', padding:'0.5rem 1rem',
                fontSize:'0.85rem', fontWeight:'600', transition:'opacity 0.4s'
            });
            document.body.appendChild(bar);
        }
        if (!msg) { bar.style.opacity = '0'; return; }
        bar.style.opacity    = '1';
        bar.style.background = type === 'error' ? '#f8d7da' : '#fff3cd';
        bar.style.color      = type === 'error' ? '#721c24' : '#856404';
        bar.textContent      = msg;
    }

    function fetchTimeout(url, opts, ms) {
        return new Promise(function (resolve, reject) {
            var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
            fetch(url, opts)
                .then(function (r) { clearTimeout(t); resolve(r); })
                .catch(function (e) { clearTimeout(t); reject(e); });
        });
    }

    async function request(method, path, body, attempt) {
        attempt = attempt || 1;

        var opts = {
            method:      method,
            credentials: 'include', // Send the httpOnly cookie with every request
            headers:     { 'Content-Type': 'application/json' }
            // No Authorization header — the cookie handles auth automatically
        };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);

        try {
            var res = await fetchTimeout(BASE + path, opts, TIMEOUT_MS);
            showBar('');
            return res;
        } catch (err) {
            if (attempt <= MAX_RETRIES) {
                showBar('⏳ Server is waking up, please wait a moment…', 'warn');
                try {
                    await fetchTimeout(BASE + '/health', { method: 'GET', credentials: 'include' }, TIMEOUT_MS);
                } catch (e) { /* ignore */ }
                return request(method, path, body, attempt + 1);
            }
            showBar('');
            throw err;
        }
    }

    global.API = {
        BASE,
        get:  function (path)       { return request('GET',    path, null, 1); },
        post: function (path, body) { return request('POST',   path, body, 1); },
        put:  function (path, body) { return request('PUT',    path, body, 1); },
        del:  function (path)       { return request('DELETE', path, null, 1); },

        /**
         * logout()
         * Calls the backend /auth/logout endpoint which clears the httpOnly cookie,
         * then removes any user info from localStorage and redirects to login.
         */
        logout: async function () {
            try {
                await request('POST', '/auth/logout', null, 1);
            } catch (e) {
                // Even if the request fails, clear local state and redirect
            }
            // Remove non-sensitive user info stored in localStorage
            ['user', 'isLoggedIn', 'userName', 'userEmail', 'isNewUser', 'scanCompleted']
                .forEach(function (k) { localStorage.removeItem(k); });
            window.location.replace('login.html');
        },

        /**
         * getCurrentUser()
         * Fetches the logged-in user from the server using the cookie.
         * Returns the user object or null if not authenticated.
         * Use this on page load instead of reading from localStorage.
         */
        getCurrentUser: async function () {
            try {
                var res = await request('GET', '/auth/me', null, 1);
                if (!res.ok) return null;
                var data = await res.json();
                return data.user || null;
            } catch (e) {
                return null;
            }
        },

        /** Pre-warm the Render server silently on page load */
        warmUp: function () {
            fetch(BASE + '/health', { credentials: 'include' }).catch(function () {});
        }
    };

    API.warmUp();

})(window);
