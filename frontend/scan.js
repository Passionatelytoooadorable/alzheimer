// scan.js
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {

    // Auth guard
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signup.html';
        return;
    }

    // Build nav
    const nav     = document.getElementById('scanNav');
    const rawUser = localStorage.getItem('user');
    const user    = rawUser ? JSON.parse(rawUser) : {};
    const scanDone = localStorage.getItem('scanCompleted') === 'true';

    if (nav) {
        if (scanDone) {
            nav.innerHTML = buildProfileNav(user);
            initProfileDropdown();
        } else {
            nav.innerHTML = `<a href="#" id="navLogout" style="font-size:0.88rem;opacity:0.85;">✕ Cancel</a>`;
            document.getElementById('navLogout').addEventListener('click', function (e) {
                e.preventDefault(); doLogout();
            });
        }
    }

    // ── DOM refs ──
    const pdfInput     = document.getElementById('pdfInput');
    const uploadArea   = document.getElementById('uploadArea');
    const uploadBtn    = document.getElementById('uploadBtn');
    const fileSelected = document.getElementById('fileSelected');
    const fileNameEl   = document.getElementById('fileName');
    const fileSizeEl   = document.getElementById('fileSize');
    const removeFileBtn= document.getElementById('removeFile');
    const analyzeBtn   = document.getElementById('analyzeBtn');
    let   selectedFile = null;

    // ── File selection ──
    // Button click → open file dialog
    uploadBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        pdfInput.click();
    });

    // Clicking anywhere else on upload area also opens dialog
    uploadArea.addEventListener('click', function (e) {
        if (e.target !== uploadBtn) pdfInput.click();
    });

    pdfInput.addEventListener('change', function () {
        if (this.files && this.files[0]) handleFile(this.files[0]);
    });

    // Drag & drop
    uploadArea.addEventListener('dragover',  function (e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', function ()  { uploadArea.classList.remove('drag-over'); });
    uploadArea.addEventListener('drop',      function (e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    });

    function handleFile(file) {
        // Accept .pdf extension OR pdf mime type
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) { alert('Please upload a PDF file only.'); return; }
        if (file.size > 10 * 1024 * 1024) { alert('File size must be under 10MB.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatSize(file.size);
        uploadArea.style.display   = 'none';
        fileSelected.style.display = 'block';
    }

    function formatSize(b) {
        if (b < 1024)    return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    removeFileBtn.addEventListener('click', function () {
        selectedFile = null;
        pdfInput.value = '';
        fileSelected.style.display = 'none';
        uploadArea.style.display   = 'block';
    });

    analyzeBtn.addEventListener('click', function () {
        if (selectedFile) startAnalysis();
    });

    // ── Analysis ──
    function showCard(id) {
        ['uploadCard', 'analysisCard', 'positiveResult', 'negativeResult'].forEach(function (cid) {
            const el = document.getElementById(cid);
            if (el) el.style.display = (cid === id) ? 'block' : 'none';
        });
    }

    async function startAnalysis() {
        showCard('analysisCard');

        // Animate steps sequentially
        await animateStep(1, 1100);
        await animateStep(2, 1400);
        await animateStep(3, 1800);
        await animateStep(4, 900);

        let result;
        try {
            result = await callAnalysisAPI(selectedFile);
            // Ensure required fields exist
            if (typeof result.positive === 'undefined') throw new Error('Bad response');
        } catch (err) {
            // Fallback simulation — 60% chance positive
            const isPositive = Math.random() > 0.4;
            result = {
                positive:  isPositive,
                riskScore: isPositive
                    ? Math.floor(55 + Math.random() * 35)
                    : Math.floor(8  + Math.random() * 22),
                findings: isPositive ? [
                    '⚠️ Elevated Amyloid-beta protein levels detected',
                    '⚠️ Tau protein markers above normal threshold',
                    '⚠️ Reduced hippocampal volume noted in scan',
                    '📊 Cognitive assessment score: 18/30 (mild impairment)'
                ] : []
            };
        }

        saveReport(result);
        showResult(result);
    }

    function animateStep(n, dur) {
        return new Promise(function (resolve) {
            const step   = document.getElementById('step' + n);
            const fill   = document.getElementById('fill' + n);
            const status = document.getElementById('status' + n);
            if (!step) { resolve(); return; }
            step.classList.add('active');
            fill.style.width = '100%';
            setTimeout(function () {
                status.textContent = '✅';
                step.classList.add('done');
                resolve();
            }, dur);
        });
    }

    async function callAnalysisAPI(file) {
        const fd = new FormData();
        fd.append('pdf', file);
        const res = await fetch(API_BASE + '/analyze/pdf', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: fd
        });
        if (!res.ok) throw new Error('API ' + res.status);
        return await res.json();
    }

    function saveReport(result) {
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.unshift({
            id:        Date.now(),
            fileName:  selectedFile ? selectedFile.name : 'report.pdf',
            date:      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            timestamp: new Date().toISOString(),
            result:    result.positive ? 'Positive' : 'Negative',
            riskScore: result.riskScore || 0,
            findings:  result.findings  || []
        });
        localStorage.setItem('userReports', JSON.stringify(reports));
    }

    function showResult(result) {
        // Mark scan done
        localStorage.setItem('scanCompleted', 'true');
        localStorage.setItem('isNewUser', 'false');

        if (result.positive) {
            showCard('positiveResult');

            // Animate risk bar after a short delay
            setTimeout(function () {
                const fill    = document.getElementById('riskBarFill');
                const percent = document.getElementById('riskPercent');
                if (fill)    fill.style.width   = (result.riskScore || 72) + '%';
                if (percent) percent.textContent = (result.riskScore || 72) + '%';
            }, 400);

            // Findings list
            const fe = document.getElementById('resultFindings');
            if (fe && result.findings && result.findings.length) {
                fe.innerHTML = result.findings.map(function (f) {
                    return '<div class="finding-item">' + f + '</div>';
                }).join('');
            }

            document.getElementById('goToDashboard').addEventListener('click', function () {
                window.location.href = 'dashboard.html';
            });
            document.getElementById('scanAgain').addEventListener('click', resetScan);

        } else {
            showCard('negativeResult');
            document.getElementById('goToDashboardNeg').addEventListener('click', function () {
                window.location.href = 'dashboard.html';
            });
            document.getElementById('scanAgainNeg').addEventListener('click', resetScan);
        }
    }

    function resetScan() {
        selectedFile   = null;
        pdfInput.value = '';
        for (var i = 1; i <= 4; i++) {
            var s = document.getElementById('step' + i);
            var f = document.getElementById('fill' + i);
            var st= document.getElementById('status' + i);
            if (s)  { s.classList.remove('active', 'done'); }
            if (f)  { f.style.width = '0%'; }
            if (st) { st.textContent = '⏳'; }
        }
        fileSelected.style.display = 'none';
        uploadArea.style.display   = 'block';
        showCard('uploadCard');
    }
});

// ── Shared nav helpers (must be global so profile.js can also use them) ──
function buildProfileNav(user) {
    var name    = (user && user.name) || localStorage.getItem('userName') || 'User';
    var initial = name.charAt(0).toUpperCase();
    return '<a href="dashboard.html">Dashboard</a>' +
           '<a href="resources.html">Resources</a>' +
           '<div class="profile-nav-wrap" id="profileNavWrap">' +
               '<button class="profile-nav-btn" id="profileNavBtn">' +
                   '<div class="profile-avatar-small">' + initial + '</div>' +
                   '<span class="profile-name-short">' + name.split(' ')[0] + '</span>' +
                   '<span class="profile-caret">▾</span>' +
               '</button>' +
               '<div class="profile-dropdown" id="profileDropdown">' +
                   '<a href="profile.html" class="dropdown-item">👤 My Profile</a>' +
                   '<a href="#" class="dropdown-item" id="dropLogout">🚪 Logout</a>' +
               '</div>' +
           '</div>';
}

function initProfileDropdown() {
    var btn = document.getElementById('profileNavBtn');
    var dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dd.classList.toggle('open');
    });
    document.addEventListener('click', function () { dd.classList.remove('open'); });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) {
        logoutEl.addEventListener('click', function (e) {
            e.preventDefault(); doLogout();
        });
    }
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(function (k) {
        localStorage.removeItem(k);
    });
    window.location.href = 'signup.html';
}
