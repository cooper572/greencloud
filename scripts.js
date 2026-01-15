/**
         * GreenCloud Logic Engine
         * Simulates/Fetches carbon data & visualizes copper gridwork
         */

        const API_KEY = "RTnu3G7yuIOrTkcpoHAV";

        const ZONE_MAP = {
            "EU-WEST": "FR",
            "US-WEST": "US-CAL-CISO",
            "UK": "GB",
            "US-EAST": "US-NEISO",
            "GERMANY": "DE",
            "AUSTRALIA": "AU-NSW",
            "CANADA": "CA-ON",
            "JAPAN": "JP",
            "INDIA": "IN"
        };

        const state = {
            intensity: 0,
            history: [],
            region: 'EU-WEST',
            status: 'medium'
        };

        // Mock data generator for 24-hour cycle
        function generateMockHistory() {
            const data = [];
            for (let i = 0; i < 24; i++) {
                // Creates a sine wave to simulate solar/demand cycles
                const val = 150 + Math.sin((i - 6) / 4) * 100 + (Math.random() * 20);
                data.push(Math.round(val));
            }
            return data;
        }

        async function fetchRealCarbonData() {
            const zone = ZONE_MAP[state.region];

            try {
                // Latest intensity
                const latestRes = await fetch(
                    `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`,
                    {
                        headers: {
                            "auth-token": API_KEY
                        }
                    }
                );

                const latestData = await latestRes.json();

                // 24h forecast
                const forecastRes = await fetch(
                    `https://api.electricitymap.org/v3/carbon-intensity/forecast?zone=${zone}`,
                    {
                        headers: {
                            "auth-token": API_KEY
                        }
                    }
                );

                const forecastData = await forecastRes.json();

                // Normalize forecast to 24 values
                state.history = forecastData.forecast.slice(0, 24).map(f => f.carbonIntensity);

                // Inject current hour value
                state.history[new Date().getHours()] = latestData.carbonIntensity;

                updateUI();

            } catch (err) {
                console.error("Carbon data fetch failed:", err);
                alert("Failed to fetch live carbon data. Falling back to simulation.");
                state.history = generateMockHistory();
                updateUI();
            }
        }

        function updateUI() {
            const intensityEl = document.getElementById('intensity-val');
            const statusBadge = document.getElementById('status-badge');
            const recText = document.getElementById('recommendation-text');
            const timeline = document.getElementById('timeline');
            const regionDisplay = document.getElementById('region-display');

            // Set Intensity
            const current = state.history[new Date().getHours()];
            intensityEl.innerText = current;
            regionDisplay.innerText = `GRID NODE: ${state.region} // ACTIVE`;

            // Status Logic
            if (current < 150) {
                state.status = 'low';
                statusBadge.innerText = 'LOW CARBON';
                statusBadge.className = 'status-badge low-carbon';
                recText.innerHTML = '<span class="run-signal">PROCEED: GRID IS CLEAN</span>';
            } else if (current > 250) {
                state.status = 'high';
                statusBadge.innerText = 'HIGH EMISSIONS';
                statusBadge.style.color = '#f87171';
                statusBadge.style.borderColor = '#f87171';
                recText.innerHTML = '<span class="wait-signal">HALT: DIRTY ENERGY PEAK</span>';
            } else {
                state.status = 'medium';
                statusBadge.innerText = 'NOMINAL';
                statusBadge.style.color = 'var(--copper-bright)';
                statusBadge.style.borderColor = 'var(--copper-dark)';
                recText.innerHTML = 'CAUTION: OPTIMAL WINDOW SOON';
            }

            // Timeline Rendering
            timeline.innerHTML = '';
            const minVal = Math.min(...state.history);
            const maxVal = Math.max(...state.history);
            const currentHour = new Date().getHours();

            state.history.forEach((val, hour) => {
                const bar = document.createElement('div');
                bar.className = 'time-bar';
                if (hour === currentHour) bar.classList.add('active');
                if (val === minVal) bar.classList.add('optimal');

                // Height calculation
                const height = ((val - (minVal * 0.8)) / (maxVal - (minVal * 0.8))) * 100;
                bar.style.height = `${Math.max(height, 10)}%`;
                bar.setAttribute('data-val', `${val}g`);

                timeline.appendChild(bar);
            });

            // Meta Details
            document.getElementById('mix-val').innerText = `${Math.round(100 - (current/4))}%`;
            document.getElementById('best-window-val').innerText = `${state.history.indexOf(minVal)}:00`;
            document.getElementById('delta-val').innerText = `-${Math.round(((current - minVal)/current)*100)}%`;
        }

        function triggerBuild() {
            alert("Task initiated. Carbon credit offset applied: 0.04kg estimated.");
        }

        function scheduleTask() {
            const best = state.history.indexOf(Math.min(...state.history));
            alert(`Task queued for ${best}:00 when carbon intensity is lowest.`);
        }

        // Initialize
        async function init() {
            await fetchRealCarbonData();

            document.getElementById('refresh-btn').addEventListener('click', async () => {
                await fetchRealCarbonData();
            });

            document.getElementById('region-selector').addEventListener('change', async (e) => {
                state.region = e.target.value;
                await fetchRealCarbonData();
            });
        }

        // Subtle animation for data entry
        window.addEventListener('DOMContentLoaded', () => {
            init();
            document.querySelectorAll('.card').forEach((c, i) => {
                c.style.opacity = 0;
                c.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    c.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    c.style.opacity = 1;
                    c.style.transform = 'translateY(0)';
                }, 100 * i);
            });
        });
