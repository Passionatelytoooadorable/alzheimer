/**
 * dashboard.js  —  Patient Dashboard
 *
 * Single source of truth: merges the old external dashboard.js
 * and the inline <script> block that was in dashboard.html.
 *
 * Load order in HTML:
 *   api.js  →  user-store.js  →  nav-shared.js  →  dashboard.js
 *
 * Architecture:
 *   • Live data comes from API (Neon PostgreSQL via Render backend)
 *   • UserStore (localStorage) is used as instant-render fallback only
 *   • After API responds, UserStore is updated so next load is fast
 */

// ─────────────────────────────────────────────────────────────────────────────
// 0.  Guard — redirect if not authenticated or wrong role
// ─────────────────────────────────────────────────────────────────────────────
(function guardAuth() {
    if (!localStorage.getItem('token')) {
        window.location.replace('login.html');
        return;
    }
    var u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.role === 'caregiver') {
        window.location.replace('caregiver.html');
    }
})();

// ─────────────────────────────────────────────────────────────────────────────
// 1.  DOM-ready entry point
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // bfcache: re-check auth when page is restored from cache
    window.addEventListener('pageshow', function (e) {
        if (e.persisted && !localStorage.getItem('token')) {
            window.location.replace('login.html');
        }
        // Close dropdown if restored from bfcache
        var dd = document.getElementById('profileDropdown');
        if (dd && e.persisted) dd.classList.remove('open');
    });

    // Nav
    if (typeof initSharedNav === 'function') initSharedNav('dashboard.html');

    // Hydrate date/day immediately (no API needed)
    hydrateDateBanner();

    // Paint name + stats from cache instantly (avoids blank numbers on load)
    hydrateFromCache();

    // Show caregiver section only for patients
    var role = (JSON.parse(localStorage.getItem('user') || '{}')).role || 'patient';
    if (role === 'patient') {
        var cgSection = document.getElementById('caregiverSection');
        if (cgSection) cgSection.style.display = 'block';
        loadLinkStatus();
        loadInbox();
        setInterval(loadInbox, 60000);
    }

    // Wire up all interactive elements
    setupMoodButtons();
    setupEmergencyModal();
    setupStorageWatcher();

    // Fire all live API calls in parallel — none blocks the others
    Promise.allSettled([
        checkHealth(),
        loadReminders(),
        loadStats(),
        loadProfile(),
        loadActivity(),
        loadLocation()
    ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Date / day banner (no API — instant)
// ─────────────────────────────────────────────────────────────────────────────
function hydrateDateBanner() {
    var now     = new Date();
    var dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var dayStr  = now.toLocaleDateString('en-US', { weekday: 'long' });

    setTxt('tbDate',      dateStr);
    setTxt('tbDay',       dayStr);
    setTxt('currentDate', dayStr + ', ' + dateStr);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Instant cache paint (runs before API returns)
// ─────────────────────────────────────────────────────────────────────────────
function hydrateFromCache() {
    // Name
    var profile = UserStore.get('profileData', {});
    var user    = JSON.parse(localStorage.getItem('user') || '{}');
    var name    = profile.name || user.name || localStorage.getItem('userName') || 'Friend';
    setTxt('userName', name);

    // Stats from cache (will be overwritten by live data)
    var memories = UserStore.get('memories', []);
    var je       = UserStore.get('journalEntries', UserStore.get('journals', []));
    var remCount = UserStore.get('reminderCount', '—');

    setTxt('memoryCount',  memories.length || '—');
    setTxt('memoryCount2', memories.length || '—');
    setTxt('journalCount', je.length       || '—');
    setTxt('journalCount2',je.length       || '—');
    setTxt('reminderCount',remCount);

    var memBadge = document.getElementById('memoryBadge');
    var jBadge   = document.getElementById('journalBadge');
    if (memBadge) memBadge.textContent = (memories.length || 0) + ' memories';
    if (jBadge)   jBadge.textContent   = (je.length || 0) + ' entries';

    var oneWeekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    var weeklyCount = je.filter(function (e) { return e.date && e.date >= oneWeekAgo; }).length;
    setTxt('weeklyCount', weeklyCount || '—');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Health check — connection pill
// ─────────────────────────────────────────────────────────────────────────────
function checkHealth() {
    return fetch('https://alzheimer-backend-new.onrender.com/api/health')
        .then(function (r) {
            var pill = document.getElementById('connPill');
            var txt  = document.getElementById('connTxt');
            if (r.ok) {
                if (pill) pill.className = 'conn-pill online';
                if (txt)  txt.textContent = 'Connected';
            } else {
                throw new Error('not ok');
            }
        })
        .catch(function () {
            var pill = document.getElementById('connPill');
            var txt  = document.getElementById('connTxt');
            if (pill) pill.className = 'conn-pill offline';
            if (txt)  txt.textContent = 'Offline';
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Reminders  —  GET /reminders?filter=today
// ─────────────────────────────────────────────────────────────────────────────
function loadReminders() {
    return API.get('/reminders?filter=today')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var list    = data.reminders || [];
            var pending = typeof data.today_pending === 'number' ? data.today_pending : list.filter(function (r) { return !r.completed; }).length;

            // Update counter badges
            setTxt('reminderCount', pending);
            setTxt('tbPend',        pending);
            setTxt('remChip',       pending + ' pending');

            // Cache for next load
            UserStore.set('reminderCount', pending);

            var ul = document.getElementById('remindersList');
            if (!ul) return;

            if (!list.length) {
                ul.innerHTML = '<li class="reminder-empty">🎉 No reminders today</li>';
                setTxt('tbNext', 'None today');
                setCompBar(0, 0);
                return;
            }

            var done = list.filter(function (r) { return r.completed; }).length;

            ul.innerHTML = list.slice(0, 4).map(function (r) {
                return '<li class="reminder-item' + (r.completed ? ' completed' : '') + '">' +
                    '<span class="reminder-status-dot">' + (r.completed ? '✅' : '⏰') + '</span>' +
                    '<span class="reminder-text">' + esc(r.title || r.text || '') + '</span>' +
                    (r.reminder_time ? '<span class="reminder-time">' + r.reminder_time.substring(0, 5) + '</span>' : '') +
                    '</li>';
            }).join('') + (list.length > 4 ? '<li class="reminder-more">+' + (list.length - 4) + ' more</li>' : '');

            setCompBar(done, list.length);

            var next = list.find(function (r) { return !r.completed && r.reminder_time; });
            setTxt('tbNext', next ? esc(next.title || next.text || '') + ' at ' + next.reminder_time.substring(0, 5) : 'All done! ✅');
        })
        .catch(function () {
            // Fallback to UserStore reminders
            var reminders = UserStore.get('reminders', []);
            var today     = new Date().toDateString();
            var todayR    = reminders.filter(function (r) { return new Date(r.date).toDateString() === today; });

            var ul = document.getElementById('remindersList');
            if (!ul) return;

            if (!todayR.length) {
                ul.innerHTML = '<li class="reminder-empty">Could not load reminders</li>';
                setTxt('tbNext', 'Unavailable');
                return;
            }

            ul.innerHTML = todayR.map(function (r) {
                return '<li class="reminder-item">' +
                    '<span class="reminder-status-dot">⏰</span>' +
                    '<span class="reminder-text">' + esc(r.text || '') + '</span>' +
                    '<span class="reminder-time">' + esc(r.time || '') + '</span>' +
                    '</li>';
            }).join('');
            setTxt('tbNext', 'Offline');
        });
}

function setCompBar(done, total) {
    var pct   = total > 0 ? Math.round((done / total) * 100) : 0;
    var fill  = document.getElementById('compFill');
    var label = document.getElementById('compLabel');
    if (fill)  fill.style.width  = pct + '%';
    if (label) label.textContent = done + ' / ' + total + ' completed';
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Stats  —  GET /journals  +  GET /memories
// ─────────────────────────────────────────────────────────────────────────────
function loadStats() {
    return Promise.all([
        API.get('/journals').then(function (r) { return r.json(); }),
        API.get('/memories').then(function (r) { return r.json(); })
    ]).then(function (results) {
        var jr = results[0];
        var mr = results[1];

        var jTotal   = parseInt((jr.stats || {}).total     || (jr.journals  || []).length || 0);
        var jWeek    = parseInt((jr.stats || {}).this_week || 0);
        var mCount   = (mr.memories || []).length;

        // Update all journal/memory stat elements
        setTxt('journalCount',  jTotal);
        setTxt('journalCount2', jTotal);
        setTxt('weeklyCount',   jWeek);
        setTxt('memoryCount',   mCount);
        setTxt('memoryCount2',  mCount);

        var jBadge  = document.getElementById('journalBadge');
        var mBadge  = document.getElementById('memoryBadge');
        if (jBadge) jBadge.textContent = jTotal + ' entries';
        if (mBadge) mBadge.textContent = mCount + ' memories';

        // Update UserStore cache
        UserStore.set('journalEntries', jr.journals || []);
        if (mr.memories) UserStore.set('memories', mr.memories);
    }).catch(function () {
        // Cache already painted in hydrateFromCache — silently do nothing
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  Profile  —  GET /profile  (emergency contact, doctor info)
// ─────────────────────────────────────────────────────────────────────────────
function loadProfile() {
    return API.get('/profile')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var p = data.profile  || {};
            var m = data.medical  || {};

            // Update name from profile if available
            if (p.name) {
                setTxt('userName', p.name);
                UserStore.set('profileData', p);
            }

            // Emergency contact
            var emergName    = document.getElementById('emergName');
            var modalName    = document.getElementById('modalEmergName');
            var emergCallBtn = document.getElementById('emergCallBtn');
            var modalCall    = document.getElementById('modalEmergCall');

            if (p.emergency) {
                if (emergName) emergName.textContent = p.emergency;
                if (modalName) modalName.textContent = p.emergency;
                if (emergCallBtn) emergCallBtn.onclick = function () { window.location.href = 'tel:' + p.emergency; };
                if (modalCall)    modalCall.onclick    = function () { window.location.href = 'tel:' + p.emergency; };
            } else {
                if (emergName) emergName.textContent = 'Not set — update in Profile';
            }

            // Doctor / hospital
            if (m.doctor)   setTxt('drName', m.doctor);
            if (m.hospital) setTxt('drHosp', m.hospital);
        })
        .catch(function () {
            // Fallback: try UserStore
            var cached = UserStore.get('profileData', {});
            if (cached.name) setTxt('userName', cached.name);
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  Activity feed  —  GET /auth/activities
// ─────────────────────────────────────────────────────────────────────────────
function loadActivity() {
    var ICONS = {
        login:            '🔐',
        signup:           '🎉',
        journal_added:    '📝',
        journal_deleted:  '🗑️',
        memory_added:     '📸',
        memory_deleted:   '🗑️',
        reminder_added:   '⏰',
        reminder_deleted: '🗑️',
        location_updated: '📍',
        report_added:     '🔬'
    };

    return API.get('/auth/activities')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var acts = (data.activities || []).slice(0, 5);
            var ul   = document.getElementById('activityList');
            if (!ul) return;

            ul.innerHTML = acts.length
                ? acts.map(function (a) {
                    return '<li class="activity-item">' +
                        '<span class="act-icon">' + (ICONS[a.activity_type] || '📌') + '</span>' +
                        '<div class="act-body">' +
                            '<div class="act-text">' + esc(a.description) + '</div>' +
                            '<div class="act-time">' + timeAgo(new Date(a.timestamp)) + '</div>' +
                        '</div></li>';
                  }).join('')
                : '<li class="activity-empty">No activity yet.</li>';
        })
        .catch(function () {
            var ul = document.getElementById('activityList');
            if (ul) ul.innerHTML = '<li class="activity-empty">Unavailable.</li>';
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// 9.  Location  —  GET /locations/last
// ─────────────────────────────────────────────────────────────────────────────
function loadLocation() {
    return API.get('/locations/last')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var loc     = data.location;
            var chip    = document.getElementById('locChip');
            var update  = document.getElementById('locUpdate');
            if (loc) {
                if (chip)   { chip.textContent = 'Sharing'; chip.className = 'tile-chip chip-mint'; }
                if (update) update.textContent = 'Last updated: ' + timeAgo(new Date(loc.timestamp));
            } else {
                if (chip)   { chip.textContent = 'Not sharing'; chip.className = 'tile-chip chip-peach'; }
                if (update) update.textContent = 'Location not shared';
            }
        })
        .catch(function () {
            var chip = document.getElementById('locChip');
            if (chip) { chip.textContent = 'Unavailable'; chip.className = 'tile-chip chip-peach'; }
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// 10.  Mood check-in
// ─────────────────────────────────────────────────────────────────────────────
function setupMoodButtons() {
    document.querySelectorAll('.mood-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mood-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            API.post('/journals', {
                title:      'Daily Mood Check-in',
                content:    'Feeling ' + btn.dataset.mood + ' today.',
                mood:       btn.dataset.mood,
                entry_date: new Date().toISOString().split('T')[0]
            })
            .then(function () {
                var el = document.getElementById('moodSaved');
                if (el) { el.classList.add('show'); setTimeout(function () { el.classList.remove('show'); }, 3000); }
                loadStats(); // refresh journal count
            })
            .catch(function () {});
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 11.  Emergency modal
// ─────────────────────────────────────────────────────────────────────────────
function setupEmergencyModal() {
    var btn   = document.getElementById('emergencyBtn');
    var modal = document.getElementById('emergencyModal');
    var close = document.getElementById('modalClose');

    if (btn && modal) {
        btn.addEventListener('click', function () { modal.style.display = 'block'; });
    }
    if (close && modal) {
        close.addEventListener('click', function () { modal.style.display = 'none'; });
    }
    window.addEventListener('click', function (e) {
        if (modal && e.target === modal) modal.style.display = 'none';
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 12.  Cross-tab storage sync (other tabs writing data updates this dashboard)
// ─────────────────────────────────────────────────────────────────────────────
function setupStorageWatcher() {
    window.addEventListener('storage', function (e) {
        if (e.key && e.key.startsWith('alz:')) {
            hydrateFromCache();  // repaint from updated cache instantly
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 13.  Caregiver link status  —  GET /caregiver/link-status
// ─────────────────────────────────────────────────────────────────────────────
async function loadLinkStatus() {
    var section = document.getElementById('linkStatusSection');
    if (!section) return;

    try {
        var res  = await API.get('/caregiver/link-status');
        var data = await res.json();
        var link = data.link;

        if (!link) {
            section.innerHTML =
                '<p style="font-size:0.83rem;color:#666;margin:0 0 0.6rem;">Enter your caregiver\'s email or username to connect with them.</p>' +
                '<div class="link-input-row">' +
                    '<input type="text" id="caregiverIdentifier" placeholder="Caregiver email or username">' +
                    '<button class="link-send-btn" onclick="sendLinkRequest()">📤 Send Request</button>' +
                '</div>' +
                '<div id="linkReqStatus"></div>';
            return;
        }

        if (link.status === 'pending') {
            section.innerHTML =
                '<div class="link-status-box pending">⏳ Request sent to <strong>' + esc(link.caregiver_name) + '</strong> — waiting for approval.</div>' +
                '<button class="unlink-btn" onclick="unlinkCaregiver()">Cancel request</button>';
            return;
        }

        if (link.status === 'accepted') {
            section.innerHTML =
                '<div class="link-status-box accepted">✅ Linked to <strong>' + esc(link.caregiver_name) + '</strong> (' + esc(link.caregiver_email) + ').<br>' +
                '<span style="font-size:0.78rem;color:#555;">Your caregiver can see your activity, location, mood trends, and send you messages.</span></div>' +
                '<button class="unlink-btn" onclick="unlinkCaregiver()">Unlink caregiver</button>';
            var msgCard = document.getElementById('messagesCard');
            if (msgCard) msgCard.style.display = 'block';
            return;
        }

        if (link.status === 'rejected') {
            section.innerHTML =
                '<div class="link-status-box rejected">❌ Your request to <strong>' + esc(link.caregiver_name) + '</strong> was declined.</div>' +
                '<button class="link-send-btn" style="margin-top:0.5rem;" onclick="unlinkAndReset()">Try a different caregiver</button>';
        }
    } catch (e) {
        if (section) section.innerHTML = '<div style="color:#aaa;font-size:0.85rem;">Could not load link status.</div>';
    }
}

window.sendLinkRequest = async function () {
    var input    = document.getElementById('caregiverIdentifier');
    var statusEl = document.getElementById('linkReqStatus');
    var id       = input ? input.value.trim() : '';

    if (!id) {
        if (statusEl) { statusEl.textContent = '⚠️ Enter caregiver email or username'; statusEl.style.color = '#e65100'; }
        return;
    }
    if (statusEl) { statusEl.textContent = 'Sending…'; statusEl.style.color = '#888'; }

    try {
        var res  = await API.post('/caregiver/link-request', { caregiver_identifier: id });
        var data = await res.json();
        if (!res.ok) {
            if (statusEl) { statusEl.textContent = '❌ ' + (data.error || 'Failed'); statusEl.style.color = '#c62828'; }
            return;
        }
        if (statusEl) { statusEl.textContent = '✅ ' + data.message; statusEl.style.color = '#2e7d32'; }
        setTimeout(loadLinkStatus, 1200);
    } catch (e) {
        if (statusEl) { statusEl.textContent = '❌ Could not send request.'; statusEl.style.color = '#c62828'; }
    }
};

window.unlinkCaregiver = async function () {
    if (!confirm('Are you sure you want to unlink from your caregiver?')) return;
    try {
        await API.del('/caregiver/unlink');
        var msgCard = document.getElementById('messagesCard');
        if (msgCard) msgCard.style.display = 'none';
        loadLinkStatus();
    } catch (e) {
        alert('Could not unlink. Please try again.');
    }
};

window.unlinkAndReset = async function () {
    try { await API.del('/caregiver/unlink'); } catch (e) {}
    loadLinkStatus();
};

// ─────────────────────────────────────────────────────────────────────────────
// 14.  Inbox  —  GET /caregiver/messages/inbox
// ─────────────────────────────────────────────────────────────────────────────
async function loadInbox() {
    try {
        var res    = await API.get('/caregiver/messages/inbox');
        var data   = await res.json();
        var msgs   = data.messages     || [];
        var unread = data.unread_count || 0;

        var badge = document.getElementById('unreadBadge');
        if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }

        var box = document.getElementById('inboxMessages');
        if (!box) return;

        if (!msgs.length) {
            box.innerHTML = '<div style="color:#aaa;font-size:0.85rem;text-align:center;padding:0.5rem;">No messages from your caregiver yet.</div>';
            return;
        }

        box.innerHTML = msgs.map(function (m) {
            return '<div class="inbox-msg' + (m.is_read ? ' read' : '') + '" id="msg-' + m.id + '">' +
                '<div class="inbox-msg-text">' + esc(m.message) + '</div>' +
                '<div class="inbox-msg-meta">' +
                    '<span>From: ' + esc(m.caregiver_name) + '</span>' +
                    '<span>' + timeAgo(new Date(m.created_at)) + '</span>' +
                    (!m.is_read
                        ? '<button class="mark-read-btn" onclick="markRead(' + m.id + ')">Mark read ✓</button>'
                        : '<span style="color:#4caf50;">✓ Read</span>') +
                '</div></div>';
        }).join('');
    } catch (e) {
        // Patient may not be linked — silently ignore
    }
}

window.markRead = async function (msgId) {
    try {
        await API.put('/caregiver/messages/' + msgId + '/read', {});
        var el = document.getElementById('msg-' + msgId);
        if (el) {
            el.classList.add('read');
            var readBtn = el.querySelector('.mark-read-btn');
            if (readBtn) readBtn.outerHTML = '<span style="color:#4caf50;">✓ Read</span>';
        }
        loadInbox();
    } catch (e) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// 15.  Utility helpers
// ─────────────────────────────────────────────────────────────────────────────
function setTxt(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}

function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeAgo(d) {
    var s = Math.floor((Date.now() - d) / 1000);
    if (isNaN(s) || s < 0) return 'just now';
    if (s < 60)     return 'Just now';
    if (s < 3600)   return Math.floor(s / 60) + 'm ago';
    if (s < 86400)  return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

// Legacy global — kept for any external callers
function callNumber(number) {
    window.location.href = 'tel:' + number;
}
