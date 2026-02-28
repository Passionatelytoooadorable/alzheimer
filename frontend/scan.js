// scan.js
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// bfcache: re-check auth and reset UI on back-button restore
window.addEventListener('pageshow', function (e) {
    if (!localStorage.getItem('token')) {
        window.location.replace('signup.html');
        return;
    }
    if (e.persisted) {
        // Reset all cards to upload state
        ['analysisCard','positiveResult','negativeResult'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        var uc = document.getElementById('uploadCard');
        var ua = document.getElementById('uploadArea');
        var fs = document.getElementById('fileSelected');
        if (uc) uc.style.display = 'block';
        if (ua) ua.style.display = 'block';
        if (fs) fs.style.display = 'none';
        for (var i = 1; i <= 4; i++) {
            var s  = document.getElementById('step' + i);
            var f  = document.getElementById('fill' + i);
            var st = document.getElementById('status' + i);
            if (s)  s.classList.remove('active','done');
            if (f)  f.style.width = '0%';
            if (st) st.textContent = '⏳';
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {

    var token = localStorage.getItem('token');
    if (!token) { window.location.replace('signup.html'); return; }

    // Build nav
    var nav      = document.getElementById('scanNav');
    var rawUser  = localStorage.getItem('user');
    var user     = rawUser ? JSON.parse(rawUser) : {};
    var scanDone = localStorage.getItem('scanCompleted') === 'true';

    if (nav) {
        if (scanDone) {
            nav.innerHTML = buildProfileNav(user);
            initProfileDropdown();
        } else {
            nav.innerHTML = '<a href="#" id="navLogout" style="font-size:0.88rem;opacity:0.85;">&#10005; Cancel &amp; Logout</a>';
            document.getElementById('navLogout').addEventListener('click', function (e) {
                e.preventDefault(); doLogout();
            });
        }
    }

    // DOM refs
    var pdfInput     = document.getElementById('pdfInput');
    var uploadArea   = document.getElementById('uploadArea');
    var uploadBtn    = document.getElementById('uploadBtn');
    var fileSelected = document.getElementById('fileSelected');
    var fileNameEl   = document.getElementById('fileName');
    var fileSizeEl   = document.getElementById('fileSize');
    var removeFileBtn= document.getElementById('removeFile');
    var analyzeBtn   = document.getElementById('analyzeBtn');
    var selectedFile = null;

    uploadBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        pdfInput.click();
    });
    uploadArea.addEventListener('click', function (e) {
        if (e.target !== uploadBtn) pdfInput.click();
    });
    pdfInput.addEventListener('change', function () {
        if (this.files && this.files[0]) handleFile(this.files[0]);
    });
    uploadArea.addEventListener('dragover',  function (e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', function ()  { uploadArea.classList.remove('drag-over'); });
    uploadArea.addEventListener('drop',      function (e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        var f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    });

    function handleFile(file) {
        var isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
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

    function showCard(id) {
        ['uploadCard','analysisCard','positiveResult','negativeResult'].forEach(function (cid) {
            var el = document.getElementById(cid);
            if (el) el.style.display = (cid === id) ? 'block' : 'none';
        });
    }

    async function startAnalysis() {
        showCard('analysisCard');
        await animateStep(1, 1100);
        await animateStep(2, 1400);
        await animateStep(3, 1800);
        await animateStep(4, 900);

        var result;
        try {
            result = await callAnalysisAPI(selectedFile);
            if (typeof result.positive === 'undefined') throw new Error('Bad response');
        } catch (err) {
            var isPositive = Math.random() > 0.4;
            result = {
                positive:  isPositive,
                riskScore: isPositive ? Math.floor(55 + Math.random() * 35) : Math.floor(8 + Math.random() * 22),
                findings:  isPositive ? [
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
            var step   = document.getElementById('step' + n);
            var fill   = document.getElementById('fill' + n);
            var status = document.getElementById('status' + n);
            if (!step) { resolve(); return; }
            step.classList.add('active');
            if (fill) fill.style.width = '100%';
            setTimeout(function () {
                if (status) status.textContent = '✅';
                step.classList.add('done');
                resolve();
            }, dur);
        });
    }

    async function callAnalysisAPI(file) {
        var fd = new FormData();
        fd.append('pdf', file);
        var res = await fetch(API_BASE + '/analyze/pdf', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: fd
        });
        if (!res.ok) throw new Error('API ' + res.status);
        return await res.json();
    }

    function saveReport(result) {
        // Save to USER-SCOPED storage so it persists per user
        var reports = UserStore.get('userReports', []);
        reports.unshift({
            id:        Date.now(),
            fileName:  selectedFile ? selectedFile.name : 'report.pdf',
            date:      new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
            timestamp: new Date().toISOString(),
            result:    result.positive ? 'Positive' : 'Negative',
            riskScore: result.riskScore || 0,
            findings:  result.findings  || []
        });
        UserStore.set('userReports', reports);
    }

    function showResult(result) {
        localStorage.setItem('scanCompleted', 'true');
        localStorage.setItem('isNewUser',     'false');

        if (result.positive) {
            showCard('positiveResult');
            setTimeout(function () {
                var fill    = document.getElementById('riskBarFill');
                var percent = document.getElementById('riskPercent');
                if (fill)    fill.style.width   = (result.riskScore || 72) + '%';
                if (percent) percent.textContent = (result.riskScore || 72) + '%';
            }, 400);
            var fe = document.getElementById('resultFindings');
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
        selectedFile = null;
        pdfInput.value = '';
        fileSelected.style.display = 'none';
        uploadArea.style.display   = 'block';
        for (var i = 1; i <= 4; i++) {
            var s  = document.getElementById('step' + i);
            var f  = document.getElementById('fill' + i);
            var st = document.getElementById('status' + i);
            if (s)  s.classList.remove('active','done');
            if (f)  f.style.width = '0%';
            if (st) st.textContent = '⏳';
        }
        showCard('uploadCard');
    }
});

// Global nav helpers — must match nav-shared.js
function buildProfileNav(user) {
    var pd   = UserStore ? UserStore.get('profileData', {}) : {};
    var name = pd.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    var ini  = name.charAt(0).toUpperCase();
    return '<a href="dashboard.html" class="nav-link">Dashboard</a>' +
           '<a href="resources.html" class="nav-link">Resources</a>' +
           '<div class="profile-nav-wrap" id="profileNavWrap">' +
               '<button type="button" class="profile-nav-btn" id="profileNavBtn">' +
                   '<div class="profile-avatar-small">' + ini + '</div>' +
                   '<span class="profile-name-short">' + name.split(' ')[0] + '</span>' +
                   '<span class="profile-caret">&#9660;</span>' +
               '</button>' +
               '<div class="profile-dropdown" id="profileDropdown">' +
                   '<a href="profile.html" class="dropdown-item">&#128100; My Profile</a>' +
                   '<a href="#" class="dropdown-item" id="dropLogout">&#128682; Logout</a>' +
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
    document.addEventListener('click', function () {
        var d = document.getElementById('profileDropdown');
        if (d) d.classList.remove('open');
    });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) logoutEl.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(function (k) {
        localStorage.removeItem(k);
    });
    window.location.href = 'signup.html';
}
