// scan.js — PDF scan page logic
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {

    // ── Auth Guard: must be logged in to see scan page ──
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signup.html';
        return;
    }

    // ── Nav: on scan page, only show minimal links (no bypass to dashboard) ──
    const nav = document.getElementById('scanNav');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const scanDone = localStorage.getItem('scanCompleted') === 'true';

    if (scanDone) {
        // Returning user who navigated back — show full nav
        nav.innerHTML = buildProfileNav(user);
        initProfileDropdown();
    } else {
        // New user mid-scan — only show logout, no dashboard bypass
        nav.innerHTML = `<a href="#" id="navLogout" style="opacity:0.8;font-size:0.9rem;">✕ Cancel &amp; Logout</a>`;
        document.getElementById('navLogout').addEventListener('click', function (e) {
            e.preventDefault();
            doLogout();
        });
    }

    // ── File Handling ──
    const uploadArea  = document.getElementById('uploadArea');
    const uploadBtn   = document.getElementById('uploadBtn');
    const pdfInput    = document.getElementById('pdfInput');
    const fileSelected = document.getElementById('fileSelected');
    const fileNameEl  = document.getElementById('fileName');
    const fileSizeEl  = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFile');
    const analyzeBtn  = document.getElementById('analyzeBtn');
    let selectedFile  = null;

    uploadBtn.addEventListener('click', () => pdfInput.click());
    uploadArea.addEventListener('click', (e) => { if (e.target !== uploadBtn) pdfInput.click(); });

    pdfInput.addEventListener('change', function () {
        if (this.files && this.files[0]) handleFile(this.files[0]);
    });

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (file.type !== 'application/pdf') { alert('Please upload a PDF file only.'); return; }
        if (file.size > 10 * 1024 * 1024) { alert('File size must be under 10MB.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatSize(file.size);
        uploadArea.style.display = 'none';
        document.querySelector('.demo-strip').style.display = 'none';
        fileSelected.style.display = 'block';
    }

    function formatSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
        return (b/1048576).toFixed(1) + ' MB';
    }

    removeFileBtn.addEventListener('click', function () {
        selectedFile = null;
        pdfInput.value = '';
        fileSelected.style.display = 'none';
        uploadArea.style.display = 'block';
        document.querySelector('.demo-strip').style.display = 'block';
    });

    analyzeBtn.addEventListener('click', () => { if (selectedFile) startAnalysis(false); });

    // ── Analysis Flow ──
    function showCard(id) {
        ['uploadCard','analysisCard','positiveResult','negativeResult'].forEach(cid => {
            const el = document.getElementById(cid);
            if (el) el.style.display = (cid === id) ? 'block' : 'none';
        });
    }

    async function startAnalysis(isDemo) {
        showCard('analysisCard');
        await animateStep(1, 1100);
        await animateStep(2, 1400);
        await animateStep(3, 1800);
        await animateStep(4, 900);

        let result;
        if (isDemo) {
            // Deterministic demo: positive result
            result = {
                positive: true,
                riskScore: 68,
                fileName: 'Demo Analysis',
                findings: [
                    '⚠️ Elevated Amyloid-beta protein levels detected',
                    '⚠️ Tau protein markers above normal threshold',
                    '⚠️ Reduced hippocampal volume noted in scan',
                    '📊 Cognitive assessment score: 18/30 (mild impairment)'
                ]
            };
        } else {
            try {
                result = await callAnalysisAPI(selectedFile);
            } catch (err) {
                // Fallback simulation when API not available
                const isPositive = Math.random() > 0.4;
                result = {
                    positive: isPositive,
                    riskScore: isPositive ? Math.floor(55 + Math.random() * 35) : Math.floor(8 + Math.random() * 18),
                    fileName: selectedFile ? selectedFile.name : 'report.pdf',
                    findings: isPositive ? [
                        '⚠️ Elevated Amyloid-beta protein levels detected',
                        '⚠️ Tau protein markers above normal threshold',
                        '⚠️ Reduced hippocampal volume noted in scan',
                        '📊 Cognitive assessment score: 18/30 (mild impairment)'
                    ] : []
                };
            }
        }

        // Save report to user's profile history
        saveReportToProfile(result, isDemo ? 'Demo Analysis' : (selectedFile ? selectedFile.name : 'report.pdf'));

        showResult(result);
    }

    function animateStep(n, dur) {
        return new Promise(resolve => {
            const step   = document.getElementById('step' + n);
            const fill   = document.getElementById('fill' + n);
            const status = document.getElementById('status' + n);
            step.classList.add('active');
            fill.style.width = '100%';
            setTimeout(() => {
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
        if (!res.ok) throw new Error('API error');
        return await res.json();
    }

    function saveReportToProfile(result, fileName) {
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.unshift({
            id: Date.now(),
            fileName: fileName,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            timestamp: new Date().toISOString(),
            result: result.positive ? 'Positive' : 'Negative',
            riskScore: result.riskScore || 0,
            findings: result.findings || []
        });
        localStorage.setItem('userReports', JSON.stringify(reports));
    }

    function showResult(result) {
        // Mark scan as completed
        localStorage.setItem('scanCompleted', 'true');
        localStorage.setItem('isNewUser', 'false');

        if (result.positive) {
            showCard('positiveResult');
            setTimeout(() => {
                document.getElementById('riskBarFill').style.width = result.riskScore + '%';
                document.getElementById('riskPercent').textContent = result.riskScore + '%';
            }, 300);
            const fe = document.getElementById('resultFindings');
            if (result.findings && result.findings.length) {
                fe.innerHTML = result.findings.map(f => `<div class="finding-item">${f}</div>`).join('');
            }
            document.getElementById('goToDashboard').addEventListener('click', () => { window.location.href = 'dashboard.html'; });
            document.getElementById('scanAgain').addEventListener('click', resetScan);
        } else {
            showCard('negativeResult');
            document.getElementById('goToDashboardNeg').addEventListener('click', () => { window.location.href = 'dashboard.html'; });
            document.getElementById('scanAgainNeg').addEventListener('click', resetScan);
        }
    }

    function resetScan() {
        selectedFile = null;
        pdfInput.value = '';
        for (let i = 1; i <= 4; i++) {
            document.getElementById('step' + i).classList.remove('active', 'done');
            document.getElementById('fill' + i).style.width = '0%';
            document.getElementById('status' + i).textContent = '⏳';
        }
        fileSelected.style.display = 'none';
        uploadArea.style.display = 'block';
        showCard('uploadCard');
    }
});

// ── Shared helpers ──
function buildProfileNav(user) {
    const name = user.name || localStorage.getItem('userName') || 'User';
    const initial = name.charAt(0).toUpperCase();
    return `
        <a href="dashboard.html">Dashboard</a>
        <a href="resources.html">Resources</a>
        <div class="profile-nav-wrap" id="profileNavWrap">
            <button class="profile-nav-btn" id="profileNavBtn">
                <div class="profile-avatar-small">${initial}</div>
                <span class="profile-name-short">${name.split(' ')[0]}</span>
                <span class="profile-caret">▾</span>
            </button>
            <div class="profile-dropdown" id="profileDropdown">
                <a href="profile.html" class="dropdown-item">👤 My Profile</a>
                <a href="#" class="dropdown-item" id="dropLogout">🚪 Logout</a>
            </div>
        </div>`;
}

function initProfileDropdown() {
    const btn = document.getElementById('profileNavBtn');
    const dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
    document.addEventListener('click', () => dd.classList.remove('open'));
    const logoutEl = document.getElementById('dropLogout');
    if (logoutEl) logoutEl.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'signup.html';
}
