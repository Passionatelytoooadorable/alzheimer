/**
 * api.js  —  Frontend API helper
 *
 * Solves the Render cold-start "network error":
 *   Render's free tier sleeps after 15 min inactivity.
 *   First request after sleep can take 30-60 seconds and times out.
 *   This wrapper retries automatically with a friendly status message.
 *
 * Usage (after including this script):
 *   const res  = await API.post('/auth/signin', { email, password });
 *   const data = await res.json();
 *
 *   const res  = await API.get('/profile');
 *   const data = await res.json();
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
        var token   = localStorage.getItem('token');
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        var opts = { method: method, headers: headers };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);

        try {
            var res = await fetchTimeout(BASE + path, opts, TIMEOUT_MS);
            showBar('');  // clear on success
            return res;
        } catch (err) {
            if (attempt <= MAX_RETRIES) {
                showBar('⏳ Server is waking up, please wait a moment…', 'warn');
                // Hit health endpoint to wake Render, then retry
                try { await fetchTimeout(BASE + '/health', { method:'GET' }, TIMEOUT_MS); }
                catch (e) { /* ignore */ }
                return request(method, path, body, attempt + 1);
            }
            showBar('');
            throw err;   // all retries exhausted — caller handles
        }
    }

    global.API = {
        BASE,
        get:  function (path)       { return request('GET',    path, null,  1); },
        post: function (path, body) { return request('POST',   path, body,  1); },
        put:  function (path, body) { return request('PUT',    path, body,  1); },
        del:  function (path)       { return request('DELETE', path, null,  1); },

        /** Call on page load to pre-warm the Render server silently */
        warmUp: function () {
            fetch(BASE + '/health').catch(function () {});
        }
    };

    // Warm up as soon as this script is parsed
    API.warmUp();

})(window);
