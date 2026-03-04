// journal_mood_patch.js
// ADD this <script> block to the bottom of journal.html (before </body>)
// It adds a 7-day mood trend chart using Chart.js

/*
 HOW TO ADD TO journal.html:
 1. Add in <head>:
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>

 2. Add this HTML just below the <section class="journal-header"> section:
    <div id="moodChartSection" style="background:white;border-radius:12px;padding:1.25rem;margin:1rem 2rem;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:none;">
        <h3 style="font-size:1rem;color:#444;margin-bottom:0.75rem;">😊 Mood Trend (Last 7 Days)</h3>
        <div style="height:160px;"><canvas id="moodTrendChart"></canvas></div>
    </div>

 3. Add this at the bottom of journal.js OR as a separate <script> tag:
*/

async function loadMoodChart() {
    try {
        var res  = await API.get('/journals/stats/moods');
        var data = await res.json();
        var moods = data.moods || [];

        var moodScore = { '😊': 5, '😌': 4, '😐': 3, '😢': 2, '😠': 2, '😴': 3 };
        var moodColors = {
            5: 'rgba(76,175,80,0.8)',
            4: 'rgba(74,134,232,0.8)',
            3: 'rgba(158,158,158,0.8)',
            2: 'rgba(244,67,54,0.8)'
        };

        var days   = [];
        var scores = [];
        var colors = [];

        for (var i = 6; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var key = d.toISOString().split('T')[0];
            days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            var dayMoods = moods.filter(m => m.entry_date === key);
            if (dayMoods.length) {
                var avg = dayMoods.reduce((s, m) => s + (moodScore[m.mood] || 3), 0) / dayMoods.length;
                var rounded = Math.round(avg);
                scores.push(rounded);
                colors.push(moodColors[rounded] || 'rgba(158,158,158,0.8)');
            } else {
                scores.push(null);
                colors.push('rgba(200,200,200,0.5)');
            }
        }

        var section = document.getElementById('moodChartSection');
        if (section) section.style.display = 'block';

        var ctx = document.getElementById('moodTrendChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Mood Score',
                    data: scores,
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                var emojis = {5:'😊 Happy', 4:'😌 Calm', 3:'😐 Neutral', 2:'😢 Sad/Frustrated'};
                                return emojis[ctx.raw] || 'No data';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0, max: 5, ticks: { stepSize: 1,
                            callback: v => ({ 1:'😢', 2:'😐', 3:'😌', 4:'😊', 5:'🤩' }[v] || '')
                        },
                        grid: { color: '#f5f5f5' }
                    },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    } catch(e) {
        console.warn('Could not load mood chart:', e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadMoodChart, 500); // slight delay to let journal.js load first
});
