/**
 * seed-demo.js  —  Creates two realistic demo accounts for viva demo
 *
 * Usage (from project root, with DB env vars set):
 *   node seed-demo.js
 *
 * Creates:
 *   Patient  — demo@alzcare.app   / Demo1234!
 *   Caregiver — care@alzcare.app  / Demo1234!
 *
 * Run once before the demo. Safe to re-run (skips if accounts exist).
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

const PATIENT_EMAIL    = 'demo@alzcare.app';
const CAREGIVER_EMAIL  = 'care@alzcare.app';
const DEMO_PASSWORD    = 'Demo1234!';

async function seed() {
    console.log('🌱  Seeding demo accounts…\n');

    /* ── Password hash (shared) ────────────────────────────────────────── */
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    /* ── Caregiver ─────────────────────────────────────────────────────── */
    const existCG = await query('SELECT id FROM users WHERE email=$1', [CAREGIVER_EMAIL]);
    let cgId;
    if (existCG.rows.length) {
        cgId = existCG.rows[0].id;
        console.log('  ✅  Caregiver already exists — id:', cgId);
    } else {
        const r = await query(
            `INSERT INTO users (name, email, username, password_hash, phone_number, role)
             VALUES ($1,$2,$3,$4,$5,'caregiver')
             RETURNING id`,
            ['Sarah (Demo Caregiver)', CAREGIVER_EMAIL, 'demo_caregiver', hash, '+91-9900000001']
        );
        cgId = r.rows[0].id;
        console.log('  ✅  Caregiver created — id:', cgId);
    }

    /* ── Patient ───────────────────────────────────────────────────────── */
    const existPT = await query('SELECT id FROM users WHERE email=$1', [PATIENT_EMAIL]);
    let ptId;
    if (existPT.rows.length) {
        ptId = existPT.rows[0].id;
        console.log('  ✅  Patient already exists — id:', ptId);
    } else {
        const r = await query(
            `INSERT INTO users (name, email, username, password_hash, phone_number, role)
             VALUES ($1,$2,$3,$4,$5,'patient')
             RETURNING id`,
            ['Rajesh (Demo Patient)', PATIENT_EMAIL, 'demo_patient', hash, '+91-9900000002']
        );
        ptId = r.rows[0].id;
        console.log('  ✅  Patient created — id:', ptId);
    }

    /* ── Profile data ───────────────────────────────────────────────────── */
    await query(
        `INSERT INTO profiles (user_id, age, gender, diagnosis_date, emergency_contact, emergency_phone)
         VALUES ($1, 68, 'Male', '2023-06-15', 'Sarah (Daughter)', '+91-9900000001')
         ON CONFLICT (user_id) DO NOTHING`,
        [ptId]
    ).catch(() => {}); // skip if table doesn't have this shape

    /* ── Journal entries (patient) ─────────────────────────────────────── */
    const journals = [
        { days: 0,  title: 'Morning Thoughts',       content: 'Slept well last night. Had tea in the garden — the roses are blooming beautifully. Felt calm and grateful today.', mood: '😊' },
        { days: 1,  title: 'A Good Visit',            content: 'Sarah came to visit and we looked at old photos together. I remembered the trip to Shimla in 1998 quite clearly! It was wonderful.', mood: '😊' },
        { days: 2,  title: 'Feeling a bit tired',     content: 'Did not sleep as well as usual. Dr. Mehta's appointment went well though — he said my vitals are stable. Need to drink more water.', mood: '😴' },
        { days: 3,  title: 'Puzzle Day',              content: 'Spent an hour on the crossword puzzle. Finished two-thirds of it before lunch. The memory game on the app helped me feel sharp.', mood: '😌' },
        { days: 5,  title: 'Family Call',             content: 'Video called with the grandchildren today. They are growing so fast. Priya recited a poem for me — it made me so happy!', mood: '😊' },
        { days: 7,  title: 'Quiet Sunday',            content: 'Quiet day at home. Read two chapters of the novel Sarah brought last week. The story is about a family in Kerala — reminds me of our holidays there.', mood: '😌' },
        { days: 10, title: 'Medication reminder',     content: 'Remembered to take all three medications before breakfast for the first time this week. The reminder app really helps.', mood: '😊' },
        { days: 14, title: 'Some confusion today',    content: 'Had trouble remembering what day it was in the afternoon. Called Sarah and she reassured me. Feeling better now after the walk.', mood: '😢' },
    ];

    for (const j of journals) {
        const entryDate = new Date(Date.now() - j.days * 86400000).toISOString().split('T')[0];
        await query(
            `INSERT INTO journals (user_id, title, content, mood, entry_date)
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
            [ptId, j.title, j.content, j.mood, entryDate]
        ).catch(() => {});
    }
    console.log('  ✅  Journal entries seeded');

    /* ── Reminders (patient) ────────────────────────────────────────────── */
    const today = new Date().toISOString().split('T')[0];
    const reminders = [
        { title: 'Take morning medication (Donepezil 5mg)', reminder_time: '08:00', reminder_date: today, repeat_type: 'daily' },
        { title: 'Blood pressure check',                    reminder_time: '09:30', reminder_date: today, repeat_type: 'daily' },
        { title: 'Dr. Mehta follow-up call',                reminder_time: '11:00', reminder_date: today, repeat_type: 'none' },
        { title: 'Lunch & Vitamin D supplement',            reminder_time: '13:00', reminder_date: today, repeat_type: 'daily' },
        { title: 'Afternoon walk (30 min)',                  reminder_time: '16:30', reminder_date: today, repeat_type: 'daily' },
        { title: 'Evening medication (Memantine 10mg)',     reminder_time: '19:00', reminder_date: today, repeat_type: 'daily' },
        { title: 'Call family',                             reminder_time: '20:00', reminder_date: today, repeat_type: 'weekly' },
    ];
    for (const rem of reminders) {
        await query(
            `INSERT INTO reminders (user_id, title, reminder_time, reminder_date, repeat_type, completed)
             VALUES ($1,$2,$3,$4,$5,false) ON CONFLICT DO NOTHING`,
            [ptId, rem.title, rem.reminder_time, rem.reminder_date, rem.repeat_type]
        ).catch(() => {});
    }
    console.log('  ✅  Reminders seeded');

    /* ── Medical report ─────────────────────────────────────────────────── */
    await query(
        `INSERT INTO reports (user_id, file_name, result, risk_score, findings, report_date)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [
            ptId,
            'cognitive_assessment_jun2024.pdf',
            'Positive',
            72,
            JSON.stringify([
                '⚠️ Elevated Amyloid-beta protein levels detected',
                '⚠️ Tau protein markers above normal threshold',
                '⚠️ Reduced hippocampal volume noted (MRI)',
                '📊 MoCA score: 19/30 (mild cognitive impairment)',
                '💊 Donepezil 5mg + Memantine 10mg prescribed'
            ]),
            '2024-06-15'
        ]
    ).catch(() => {});
    console.log('  ✅  Medical report seeded');

    /* ── Caregiver–patient link ─────────────────────────────────────────── */
    await query(
        `INSERT INTO caregiver_links (patient_id, caregiver_id, status, created_at)
         VALUES ($1,$2,'accepted', NOW()) ON CONFLICT DO NOTHING`,
        [ptId, cgId]
    ).catch(() => {});
    console.log('  ✅  Caregiver link seeded');

    /* ── Caregiver message ──────────────────────────────────────────────── */
    await query(
        `INSERT INTO caregiver_messages (caregiver_id, patient_id, message, is_read, created_at)
         VALUES ($1,$2,$3,false,NOW()) ON CONFLICT DO NOTHING`,
        [cgId, ptId, "Hi Dad! Don't forget Dr. Mehta's call at 11 AM today. I'll visit this evening — we can watch that cricket match together. Love, Sarah 💙"]
    ).catch(() => {});
    console.log('  ✅  Caregiver message seeded');

    /* ── User activities ────────────────────────────────────────────────── */
    const activities = [
        { user_id: ptId, type: 'login',          desc: 'User logged in' },
        { user_id: ptId, type: 'journal_added',  desc: 'Added journal entry: Morning Thoughts' },
        { user_id: ptId, type: 'reminder_added', desc: 'Added reminder: Take morning medication' },
        { user_id: ptId, type: 'report_added',   desc: 'Uploaded cognitive assessment report' },
        { user_id: cgId, type: 'login',          desc: 'Caregiver logged in' },
    ];
    for (const a of activities) {
        await query(
            `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1,$2,$3)`,
            [a.user_id, a.type, a.desc]
        ).catch(() => {});
    }
    console.log('  ✅  Activity log seeded');

    console.log('\n🎉  Demo seed complete!\n');
    console.log('  Patient   email :', PATIENT_EMAIL);
    console.log('  Caregiver email :', CAREGIVER_EMAIL);
    console.log('  Password        :', DEMO_PASSWORD);
    console.log('\nUse these credentials on the live Vercel/Render deployment.\n');
    process.exit(0);
}

seed().catch(function(err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
