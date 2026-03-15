/**
 * demo-data.js  —  Seeds realistic localStorage data for demo/viva
 *
 * Include this on any page ONCE (it skips if data already exists):
 *   <script src="demo-data.js"></script>
 *
 * Safe to include permanently — it only runs when called explicitly,
 * or when the query param ?seedDemo=1 is present.
 *
 * To reset demo data, call: window.DemoData.reset()
 * To seed demo data, call:  window.DemoData.seed()
 */
(function (global) {
    'use strict';

    /* ── Demo user ─────────────────────────────────────────────────────── */
    var DEMO_USER = {
        id: 'demo_001',
        name: 'Rajesh Kumar',
        email: 'demo@alzcare.app',
        username: 'demo_patient',
        role: 'patient',
        phone_number: '+91-9900000002',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    };

    var DEMO_PROFILE = {
        name:       'Rajesh Kumar',
        age:        68,
        gender:     'Male',
        phone:      '+91-9900000002',
        address:    '12, MG Road, Bengaluru, Karnataka',
        emergency:  'Sarah Kumar (Daughter) — +91-9900000001',
        diagnosis:  '2023-06-15',
        bloodType:  'B+',
        allergies:  'Penicillin',
        conditions: 'Mild Alzheimer\'s Disease (Early Stage), Hypertension',
        medications:'Donepezil 5mg (morning), Memantine 10mg (evening), Amlodipine 5mg (morning)',
        doctor:     'Dr. Arvind Mehta (Neurologist)',
        hospital:   'Manipal Hospital, Bengaluru'
    };

    /* ── Helper: days ago date string ───────────────────────────────────── */
    function daysAgo(d) {
        return new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
    }
    function todayStr() { return new Date().toISOString().split('T')[0]; }

    /* ── Memories ───────────────────────────────────────────────────────── */
    var MEMORIES = [
        { id: 1, title: 'Trip to Shimla — 1998', description: 'Family holiday to Shimla. Priya was just 5 years old. We stayed at the Oberoi hotel and built a snowman in the garden.', date: daysAgo(5),  category: 'Family', emoji: '⛰️' },
        { id: 2, title: 'Priya\'s School Play',   description: 'Priya played the lead in the school play about Indian independence. She remembered every single line and the audience gave a standing ovation.', date: daysAgo(12), category: 'Family', emoji: '🎭' },
        { id: 3, title: 'Retirement Party',       description: 'Friends and colleagues from 30 years at Infosys came together. Received a beautiful watch and a handmade card from the whole team.', date: daysAgo(45), category: 'Work',   emoji: '🎉' },
        { id: 4, title: 'Wedding Anniversary',    description: '40th wedding anniversary dinner at ITC Windsor. Geeta looked beautiful in her red saree — the same one she wore on our wedding day.', date: daysAgo(60), category: 'Family', emoji: '💍' },
        { id: 5, title: 'Morning Garden Routine', description: 'Every morning at 6:30 AM I water the roses and have my first cup of chai on the garden bench. The jasmine smells wonderful in October.', date: daysAgo(2),  category: 'Daily',  emoji: '🌹' },
        { id: 6, title: 'Cricket World Cup 2011', description: 'Watched the World Cup final with the whole family. When Dhoni hit that six, everyone screamed and hugged. One of the happiest nights of my life.', date: daysAgo(90), category: 'Sports', emoji: '🏏' },
    ];

    /* ── Journal entries ────────────────────────────────────────────────── */
    var JOURNALS = [
        { id: 1,  title: 'Morning Thoughts',       content: 'Slept well last night. Had tea in the garden — the roses are blooming beautifully. Felt calm and grateful today. The memory app reminded me to take my Donepezil.', date: daysAgo(0),  mood: '😊' },
        { id: 2,  title: 'A Good Visit from Sarah', content: 'Sarah came to visit and we looked at old photos together. I remembered the trip to Shimla in 1998 quite clearly! It was wonderful. She brought rasgullas from the sweet shop near her office.', date: daysAgo(1),  mood: '😊' },
        { id: 3,  title: 'Feeling a bit tired',     content: 'Did not sleep as well as usual. Dr. Mehta\'s appointment went well though — he said my vitals are stable and the new dosage seems to be working. Need to drink more water.', date: daysAgo(2),  mood: '😴' },
        { id: 4,  title: 'Puzzle Day',              content: 'Spent an hour on the crossword puzzle. Finished two-thirds of it before lunch. The memory game on the app helped me feel sharp. My score improved from last week.', date: daysAgo(3),  mood: '😌' },
        { id: 5,  title: 'Family Video Call',       content: 'Video called with the grandchildren today. Arjun showed me his new robot toy and Ananya recited a poem for me — it made me so happy! Priya is looking well too.', date: daysAgo(5),  mood: '😊' },
        { id: 6,  title: 'Quiet Sunday',            content: 'Quiet day at home. Read two chapters of the novel Sarah brought last week. The story is about a family in Kerala — reminds me of our holidays there in 2005.', date: daysAgo(7),  mood: '😌' },
        { id: 7,  title: 'Medication streak',       content: 'Remembered to take all three medications before breakfast for the fifth day in a row. The reminder app really helps. Dr. Mehta will be pleased to hear this.', date: daysAgo(10), mood: '😊' },
        { id: 8,  title: 'Some confusion today',    content: 'Had trouble remembering what day it was in the afternoon. Called Sarah and she reassured me. Feeling better after the walk around the block with the neighbour Ravi.', date: daysAgo(14), mood: '😢' },
        { id: 9,  title: 'Morning Gratitude',       content: 'Sitting in the garden thinking about all the things I am grateful for: my family, my health (considering everything), a warm home, and this sunny weather in Bengaluru.', date: daysAgo(18), mood: '😊' },
        { id: 10, title: 'Good memory day',         content: 'Amazed myself today — remembered Priya\'s childhood phone number from memory and also recalled our 1998 Shimla hotel name without checking the photo album.', date: daysAgo(21), mood: '😊' },
    ];

    /* ── Reminders ──────────────────────────────────────────────────────── */
    var REMINDERS = [
        { id: 1, title: 'Take morning medication (Donepezil 5mg)', date: todayStr(), time: '08:00', completed: true,  repeat: 'daily'  },
        { id: 2, title: 'Blood pressure check',                    date: todayStr(), time: '09:30', completed: true,  repeat: 'daily'  },
        { id: 3, title: 'Dr. Mehta follow-up call',                date: todayStr(), time: '11:00', completed: false, repeat: 'none'   },
        { id: 4, title: 'Lunch & Vitamin D supplement',            date: todayStr(), time: '13:00', completed: false, repeat: 'daily'  },
        { id: 5, title: 'Afternoon walk (30 min)',                  date: todayStr(), time: '16:30', completed: false, repeat: 'daily'  },
        { id: 6, title: 'Evening medication (Memantine 10mg)',     date: todayStr(), time: '19:00', completed: false, repeat: 'daily'  },
        { id: 7, title: 'Call family',                             date: todayStr(), time: '20:00', completed: false, repeat: 'weekly' },
    ];

    /* ── Reports ────────────────────────────────────────────────────────── */
    var REPORTS = [
        {
            id: 'report_demo_001',
            fileName:  'cognitive_assessment_jun2024.pdf',
            date:      'June 15, 2024',
            timestamp: new Date(Date.now() - 90 * 86400000).toISOString(),
            result:    'Positive',
            riskScore: 72,
            findings: [
                '⚠️ Elevated Amyloid-beta protein levels detected',
                '⚠️ Tau protein markers above normal threshold',
                '⚠️ Reduced hippocampal volume noted (MRI)',
                '📊 MoCA score: 19/30 (mild cognitive impairment)',
                '💊 Donepezil 5mg + Memantine 10mg prescribed'
            ]
        }
    ];

    /* ── Key scoping (matches UserStore pattern) ────────────────────────── */
    function sk(name) {
        return 'alz:' + DEMO_USER.email + ':' + name;
    }

    function set(name, value) {
        try { localStorage.setItem(sk(name), JSON.stringify(value)); } catch (e) {}
    }

    /* ── Seed function ──────────────────────────────────────────────────── */
    function seed() {
        // Auth tokens
        localStorage.setItem('token',        'demo_token_' + Date.now());
        localStorage.setItem('user',         JSON.stringify(DEMO_USER));
        localStorage.setItem('isLoggedIn',   'true');
        localStorage.setItem('userName',     DEMO_USER.name);
        localStorage.setItem('userEmail',    DEMO_USER.email);
        localStorage.setItem('scanCompleted','true');
        localStorage.setItem('isNewUser',    'false');

        // UserStore-scoped data
        set('profileData',   DEMO_PROFILE);
        set('memories',      MEMORIES);
        set('journalEntries',JOURNALS);
        set('journals',      JOURNALS);
        set('reminders',     REMINDERS);
        set('userReports',   REPORTS);

        // AI companion: days active (last 7 days)
        var userKey = 'user_' + 'demo_token_placeholder'.slice(-16);
        var activeDays = [];
        for (var i = 0; i < 7; i++) { activeDays.push(new Date(Date.now() - i * 86400000).toDateString()); }
        localStorage.setItem(userKey + '_activeDays', JSON.stringify(activeDays));
        localStorage.setItem(userKey + '_chatsToday', JSON.stringify({ date: new Date().toDateString(), count: 5 }));

        console.info('🌱 Demo data seeded for', DEMO_USER.email);
        return true;
    }

    /* ── Reset function ─────────────────────────────────────────────────── */
    function reset() {
        var keysToRemove = ['token','user','isLoggedIn','userName','userEmail','scanCompleted','isNewUser'];
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
        var allKeys = Object.keys(localStorage);
        allKeys.forEach(function(k) {
            if (k.startsWith('alz:' + DEMO_USER.email + ':')) localStorage.removeItem(k);
        });
        console.info('🗑️ Demo data cleared');
    }

    /* ── Auto-seed if ?seedDemo=1 in URL ────────────────────────────────── */
    if (typeof window !== 'undefined' && window.location && window.location.search.indexOf('seedDemo=1') !== -1) {
        seed();
        // Remove query param cleanly
        var url = window.location.href.replace(/[?&]seedDemo=1/, '').replace(/\?$/, '');
        window.history.replaceState({}, '', url);
    }

    global.DemoData = { seed: seed, reset: reset, user: DEMO_USER };

})(window);
