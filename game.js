// Game State Management
        let gameState = 'TUTORIAL';
        let tutorialStep = 0;
        let gameTime = new Date();
        let gameInterval;
        let currentEventIndex = 0;
        let isWaitingForEvent = false;

        // Game Configuration
        const GAME_SPEED = 800; // ms per game minute
        const ANIMATION_SPEED = 3; // seconds for train movements

        // Wesel States
        let weselStates = {
            1: 'J2_J3', // Default to main tracks
            2: 'J2',    // Default to track 2  
            3: 'STRAIGHT' // Default straight
        };

        // Signal States
        let signalStates = {
            'masuk': false,
            's1': false,
            's2': false,
            's3': false
        };

        // Schedule Data
        const schedule = [
            { 
                type: 'ARRIVAL', 
                ka: '318', 
                loco: 'CC203', 
                time: '07:15', 
                from: 'Rangkasbitung', 
                to: 'Merak',
                track: 2
            },
            { 
                type: 'DEPARTURE', 
                ka: '319', 
                loco: 'CC203', 
                time: '09:00', 
                from: 'Merak', 
                to: 'Rangkasbitung',
                track: 1
            },
            { 
                type: 'ARRIVAL', 
                ka: '312', 
                loco: 'CC206', 
                time: '11:15', 
                from: 'Rangkasbitung', 
                to: 'Merak',
                track: 2
            },
            { 
                type: 'DEPARTURE', 
                ka: '313', 
                loco: 'CC206', 
                time: '12:45', 
                from: 'Merak', 
                to: 'Rangkasbitung',
                track: 1
            }
        ];

        // Tutorial Steps
        const tutorialSteps = [
            {
                text: "Selamat datang! KA 318 akan tiba dari Rangkasbitung pukul 07:15. Pertama, pastikan Wesel 1 mengarah ke 'Jalur 1/2' untuk membuka rute masuk.",
                highlight: 'btn-wesel-1',
                action: 'wesel-1',
                validation: () => weselStates[1] === 'J2_J3'
            },
            {
                text: "Bagus! Sekarang atur Wesel 2 agar mengarah ke 'Jalur 2' sebagai jalur tujuan kedatangan.",
                highlight: 'btn-wesel-2',
                action: 'wesel-2',
                validation: () => weselStates[2] === 'J2'
            },
            {
                text: "Rute telah siap! Sekarang beri aspek aman (hijau) pada Sinyal Masuk agar kereta dapat masuk ke stasiun.",
                highlight: 'btn-signal-masuk',
                action: 'signal-masuk',
                validation: () => signalStates.masuk === true
            },
            {
                text: "Sinyal sudah aman! Klik 'Kereta Masuk' untuk menerima kedatangan KA 318.",
                highlight: 'btn-kereta-masuk',
                action: 'kereta-masuk'
            },
            {
                text: "KA 318 telah tiba di Jalur 2! Sekarang kita akan melakukan run-around (tukar haluan). Atur Wesel 3 agar menghubungkan Jalur 1 dan 2.",
                highlight: 'btn-wesel-3',
                action: 'wesel-3',
                validation: () => weselStates[3] === 'SIDING'
            },
            {
                text: "Wesel siap! Klik 'Lepas & Tukar Haluan' untuk memindahkan lokomotif ke posisi baru.",
                highlight: 'btn-lepas-haluan',
                action: 'lepas-haluan'
            },
            {
                text: "Lokomotif sudah di posisi! Klik 'Sambung Loko' untuk menyambung kembali dengan rangkaian.",
                highlight: 'btn-sambung-loko',
                action: 'sambung-loko'
            },
            {
                text: "Kereta siap berangkat dengan haluan baru! Atur Wesel 2 ke 'Jalur 1' untuk rute keberangkatan.",
                highlight: 'btn-wesel-2',
                action: 'wesel-2',
                validation: () => weselStates[2] === 'J3'
            },
            {
                text: "Beri aspek aman pada Sinyal S1-Keluar untuk jalur keberangkatan.",
                highlight: 'btn-signal-s1',
                action: 'signal-s1',
                validation: () => signalStates.s1 === true
            },
            {
                text: "Semua siap! Klik 'Berangkatkan' untuk mengirim KA 319 menuju Rangkasbitung.",
                highlight: 'btn-berangkatkan',
                action: 'berangkatkan'
            },
            {
                text: "Kereta berhasil berangkat! Klik 'Lapor St. Berikutnya' untuk menyelesaikan prosedur.",
                highlight: 'btn-lapor-stasiun',
                action: 'lapor-stasiun'
            },
            {
                text: "Selamat! Anda telah berhasil menguasai operasi run-around di Stasiun Merak. Tutorial selesai, selamat bertugas sebagai PPKA!",
                highlight: null,
                action: null
            }
        ];

        // Initialize Game
        function initGame() {
            // Set initial time 30 minutes before first train
            const [startHour, startMinute] = schedule[0].time.split(':');
            gameTime.setHours(parseInt(startHour), parseInt(startMinute) - 30, 0, 0);
            
            updateGameClock();
            updateStatusDisplays();
            updateButtonStates();
            startGameClock();
            
            // Show tutorial
            showTutorial();
            
            logActivity("Simulasi PPKA Stasiun Merak dimulai. Menunggu kedatangan KA 318...", 'success');
        }

        // Game Clock
        function startGameClock() {
            gameInterval = setInterval(() => {
                gameTime.setSeconds(gameTime.getSeconds() + 10);
                updateGameClock();
                checkScheduleEvents();
            }, GAME_SPEED);
        }

        function updateGameClock() {
            const timeString = `Pukul ${formatTime(gameTime)}`;
            document.getElementById('game-time').textContent = timeString;
        }

        function formatTime(date) {
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        function checkScheduleEvents() {
            if (currentEventIndex >= schedule.length || isWaitingForEvent) return;
            
            const nextEvent = schedule[currentEventIndex];
            const [eventHour, eventMinute] = nextEvent.time.split(':');
            const eventTime = parseInt(eventHour) * 60 + parseInt(eventMinute);
            const currentTime = gameTime.getHours() * 60 + gameTime.getMinutes();
            
            if (currentTime >= eventTime) {
                isWaitingForEvent = true;
                handleScheduleEvent(nextEvent);
            }
        }

        function handleScheduleEvent(event) {
            if (event.type === 'ARRIVAL' && gameState === 'WAITING') {
                logActivity(`PERHATIAN: KA ${event.ka} (${event.loco}) dari ${event.from} akan masuk!`, 'info');
                gameState = 'PREPARE_ARRIVAL';
                updateButtonStates();
            } else if (event.type === 'DEPARTURE' && gameState === 'READY_DEPARTURE') {
                logActivity(`PERHATIAN: Waktu keberangkatan KA ${event.ka}!`, 'info');
            }
        }

        // Tutorial System
        function showTutorial() {
            if (tutorialStep >= tutorialSteps.length) {
                endTutorial();
                return;
            }

            const step = tutorialSteps[tutorialStep];
            document.getElementById('tutorial-text').textContent = step.text;
            document.getElementById('tutorial-overlay').style.display = 'flex';
            
            // Remove previous highlights
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
            
            // Add new highlight
            if (step.highlight) {
                const element = document.getElementById(step.highlight);
                if (element) element.classList.add('highlight');
            }
            
            // Update button states for tutorial
            updateButtonStates();
        }

        function nextTutorial() {
            tutorialStep++;
            showTutorial();
        }

        function endTutorial() {
            document.getElementById('tutorial-overlay').style.display = 'none';
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
            gameState = 'WAITING';
            updateButtonStates();
            logActivity("Tutorial selesai. Mode operasi normal diaktifkan.", 'success');
        }

        // Button State Management
        function updateButtonStates() {
            const buttons = document.querySelectorAll('.game-btn');
            
            if (gameState === 'ANIMATING') {
                buttons.forEach(btn => btn.disabled = true);
                return;
            }

            // Enable all buttons first
            buttons.forEach(btn => btn.disabled = false);

            // Tutorial mode - only enable tutorial step button
            if (gameState === 'TUTORIAL') {
                buttons.forEach(btn => btn.disabled = true);
                
                const step = tutorialSteps[tutorialStep];
                if (step && step.highlight) {
                    const targetBtn = document.getElementById(step.highlight);
                    if (targetBtn) targetBtn.disabled = false;
                }
                return;
            }

            // Game state specific button management
            const disableMap = {
                'WAITING': ['btn-kereta-masuk', 'btn-lepas-haluan', 'btn-sambung-loko', 'btn-berangkatkan', 'btn-lapor-stasiun'],
                'PREPARE_ARRIVAL': ['btn-lepas-haluan', 'btn-sambung-loko', 'btn-berangkatkan', 'btn-lapor-stasiun'],
                'TRAIN_ARRIVED': ['btn-kereta-masuk', 'btn-sambung-loko', 'btn-berangkatkan', 'btn-lapor-stasiun'],
                'LOCO_SEPARATED': ['btn-kereta-masuk', 'btn-lepas-haluan', 'btn-berangkatkan', 'btn-lapor-stasiun'],
                'READY_DEPARTURE': ['btn-kereta-masuk', 'btn-lepas-haluan', 'btn-sambung-loko', 'btn-lapor-stasiun'],
                'DEPARTED': ['btn-kereta-masuk', 'btn-lepas-haluan', 'btn-sambung-loko', 'btn-berangkatkan']
            };

            const toDisable = disableMap[gameState] || [];
            toDisable.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) btn.disabled = true;
            });
        }

        // Status Updates
        function updateStatusDisplays() {
            updateWeselStatus();
            updateSignalStatus();
        }

        function updateWeselStatus() {
            const weselNames = {
                1: weselStates[1] === 'J1' ? 'BELOK (ke J1)' : 'LURUS (ke J1/2)',
                2: weselStates[2] === 'J2' ? 'LURUS (ke J2)' : 'BELOK (ke J1/3)',
                3: weselStates[3] === 'SIDING' ? 'BELOK (ke Jalur 1)' : 'LURUS (Jalur 2)'
            };

            const weselContainer = document.getElementById('wesel-status');
            weselContainer.innerHTML = '';
            
            for (let i = 1; i <= 3; i++) {
                const item = document.createElement('div');
                item.className = 'status-item';
                item.innerHTML = `
                    <span>Wesel ${i}</span>
                    <span class="status-light ${weselStates[i] !== 'DEFAULT' ? 'active' : 'inactive'}"></span>
                `;
                weselContainer.appendChild(item);
            }
        }

        function updateSignalStatus() {
            const signalContainer = document.getElementById('signal-status');
            signalContainer.innerHTML = '';
            
            const signalNames = ['masuk', 's1', 's2', 's3'];
            const signalLabels = ['S-Masuk', 'S1-Keluar', 'S2-Keluar', 'S3-Keluar'];
            
            signalNames.forEach((signal, index) => {
                const item = document.createElement('div');
                item.className = 'status-item';
                item.innerHTML = `
                    <span>${signalLabels[index]}</span>
                    <span class="status-light ${signalStates[signal] ? 'active' : 'inactive'}"></span>
                `;
                signalContainer.appendChild(item);
            });
        }

        // Logging System
        function logActivity(message, type = 'info') {
            const logContainer = document.getElementById('activity-log');
            const logItem = document.createElement('div');
            logItem.className = `log-item ${type}`;
            logItem.textContent = `[${formatTime(gameTime)}] ${message}`;
            
            logContainer.insertBefore(logItem, logContainer.firstChild);
            
            // Keep only last 50 logs
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.lastChild);
            }
            
            console.log(`[${type.toUpperCase()}] ${message}`);
        }

        // Game Actions
        function toggleSignal(signalId) {
            if (gameState === 'ANIMATING') return;
            
            const signalElement = document.getElementById(`signal-${signalId}`);
            if (!signalElement) return;
            
            signalStates[signalId] = !signalStates[signalId];
            const color = signalStates[signalId] ? '#22c55e' : '#ef4444';
            signalElement.setAttribute('fill', color);
            
            const status = signalStates[signalId] ? 'AMAN (Hijau)' : 'BERHENTI (Merah)';
            const signalName = document.querySelector(`#btn-signal-${signalId} span`).textContent;
            logActivity(`Sinyal ${signalName} diubah menjadi ${status}.`);
            
            updateStatusDisplays();
            checkTutorialProgress('signal-' + signalId);
        }

        function switchWesel(weselNum) {
            if (gameState === 'ANIMATING') return;
            
            const states = {
                1: ['J1', 'J2_J3'],
                2: ['J2', 'J3'],
                3: ['STRAIGHT', 'SIDING']
            };
            
            const currentIndex = states[weselNum].indexOf(weselStates[weselNum]);
            const nextIndex = (currentIndex + 1) % states[weselNum].length;
            weselStates[weselNum] = states[weselNum][nextIndex];
            
            const descriptions = {
                1: { 'J1': 'Jalur 1', 'J2_J3': 'Jalur 1/2' },
                2: { 'J2': 'Jalur 2', 'J3': 'Jalur 1/3' },
                3: { 'STRAIGHT': 'Lurus Jalur 2', 'SIDING': 'Jalur 1 (Tukar Haluan)' }
            };
            
            logActivity(`Wesel ${weselNum} diubah ke arah ${descriptions[weselNum][weselStates[weselNum]]}.`);
            updateStatusDisplays();
            checkTutorialProgress('wesel-' + weselNum);
        }

        function trainEnter() {
            if (gameState !== 'PREPARE_ARRIVAL' && gameState !== 'TUTORIAL') return;
            
            // Validate route
            if (weselStates[1] !== 'J2_J3' || weselStates[2] !== 'J2') {
                logActivity("GAGAL: Rute tidak sesuai! Periksa posisi wesel.", 'error');
                return;
            }
            
            if (!signalStates.masuk) {
                logActivity("GAGAL: Sinyal Masuk harus hijau!", 'error');
                return;
            }

            const event = schedule[currentEventIndex];
            logActivity(`KA ${event.ka} (${event.loco}) mulai masuk ke Jalur 2...`);
            
            gameState = 'ANIMATING';
            updateButtonStates();
            
            // Animate train entry
            animateTrainEntry(() => {
                signalStates.masuk = false;
                document.getElementById('signal-masuk').setAttribute('fill', '#ef4444');
                updateStatusDisplays();
                
                gameState = 'TRAIN_ARRIVED';
                logActivity(`KA ${event.ka} telah tiba di Jalur 2. Siap untuk tukar haluan.`, 'success');
                updateButtonStates();
                checkTutorialProgress('kereta-masuk');
            });
        }

        function runAroundOperation() {
            if (gameState !== 'TRAIN_ARRIVED') return;
            
            if (weselStates[3] !== 'SIDING') {
                logActivity("GAGAL: Wesel 3 harus menghubungkan Jalur 1 dan 2!", 'error');
                return;
            }

            logActivity("Memulai proses tukar haluan lokomotif...");
            gameState = 'ANIMATING';
            updateButtonStates();
            
            // Animate run-around
            animateRunAround(() => {
                gameState = 'LOCO_SEPARATED';
                logActivity("Lokomotif berhasil dipindah ke Jalur 1. Siap disambung kembali.", 'success');
                updateButtonStates();
                checkTutorialProgress('lepas-haluan');
            });
        }

        function reconnectLoco() {
            if (gameState !== 'LOCO_SEPARATED') return;
            
            if (weselStates[3] !== 'SIDING') {
                logActivity("GAGAL: Wesel 3 harus tetap menghubungkan Jalur 1 dan 2!", 'error');
                return;
            }

            logActivity("Menyambung lokomotif ke posisi baru...");
            gameState = 'ANIMATING';
            updateButtonStates();
            
            animateReconnect(() => {
                gameState = 'READY_DEPARTURE';
                logActivity("Tukar haluan selesai! Kereta siap berangkat dengan posisi loko baru.", 'success');
                updateButtonStates();
                checkTutorialProgress('sambung-loko');
            });
        }

        function departTrain() {
            if (gameState !== 'READY_DEPARTURE') return;
            
            if (weselStates[2] !== 'J3' || weselStates[1] !== 'J2_J3') {
                logActivity("GAGAL: Rute keberangkatan tidak sesuai! Periksa posisi wesel.", 'error');
                return;
            }
            
            if (!signalStates.s1) {
                logActivity("GAGAL: Sinyal S1 Keluar harus hijau!", 'error');
                return;
            }

            const event = schedule[currentEventIndex];
            logActivity(`KA ${event.ka + 1} (${event.loco}) diberangkatkan menuju ${event.to}...`);
            
            gameState = 'ANIMATING';
            updateButtonStates();
            
            animateTrainDeparture(() => {
                signalStates.s1 = false;
                document.getElementById('signal-s1').setAttribute('fill', '#ef4444');
                updateStatusDisplays();
                
                gameState = 'DEPARTED';
                logActivity(`KA ${event.ka + 1} telah berangkat menuju ${event.to}.`, 'success');
                updateButtonStates();
                checkTutorialProgress('berangkatkan');
            });
        }

        function reportToNextStation() {
            if (gameState !== 'DEPARTED') return;

            const event = schedule[currentEventIndex];
            logActivity(`Laporan keberangkatan KA ${event.ka + 1} terkirim ke stasiun berikutnya.`, 'success');
            
            isWaitingForEvent = false;
            currentEventIndex++;
            updateScheduleDisplay();
            
            checkTutorialProgress('lapor-stasiun');
            
            if (currentEventIndex >= schedule.length) {
                logActivity("Semua jadwal telah selesai. Operasi stasiun berakhir.", 'success');
                gameState = 'COMPLETE';
                clearInterval(gameInterval);
            } else {
                gameState = 'WAITING';
            }
            
            updateButtonStates();
        }

        function showHint() {
            const hints = {
                'WAITING': "Tunggu pengumuman kedatangan kereta sesuai jadwal",
                'PREPARE_ARRIVAL': "Atur Wesel 1 (ke Jalur 1/2) dan Wesel 2 (ke Jalur 2), lalu beri sinyal masuk hijau",
                'TRAIN_ARRIVED': "Atur Wesel 3 untuk menghubungkan Jalur 1-2, lalu lepas dan tukar haluan",
                'LOCO_SEPARATED': "Sambung lokomotif kembali ke rangkaian",
                'READY_DEPARTURE': "Atur Wesel 2 ke Jalur 1, beri sinyal S1-Keluar hijau, lalu berangkatkan",
                'DEPARTED': "Lapor ke stasiun berikutnya untuk menyelesaikan siklus"
            };
            
            const hint = hints[gameState];
            if (hint) {
                logActivity(`PETUNJUK: ${hint}`, 'info');
            }
        }

        // Animation Functions
        function animateTrainEntry(callback) {
            const trainGroup = document.getElementById('train-group');
            trainGroup.style.visibility = 'visible';
            
            // Simple animation - move train to position
            trainGroup.style.transform = 'translate(600, 900)';
            trainGroup.style.transition = `transform ${ANIMATION_SPEED}s ease-in-out`;
            
            setTimeout(callback, ANIMATION_SPEED * 1000);
        }

        function animateRunAround(callback) {
            const trainGroup = document.getElementById('train-group');
            
            // Hide carriages, show locomotive moving
            const carriages = document.getElementById('carriages');
            carriages.style.opacity = '0.3';
            
            setTimeout(callback, ANIMATION_SPEED * 1000);
        }

        function animateReconnect(callback) {
            const carriages = document.getElementById('carriages');
            carriages.style.opacity = '1';
            
            setTimeout(callback, ANIMATION_SPEED * 1000);
        }

        function animateTrainDeparture(callback) {
            const trainGroup = document.getElementById('train-group');
            trainGroup.style.transform = 'translate(400, 300)';
            
            setTimeout(() => {
                trainGroup.style.visibility = 'hidden';
                trainGroup.style.transform = 'translate(600, 900)';
                trainGroup.style.transition = 'none';
                callback();
            }, ANIMATION_SPEED * 1000);
        }

        function updateScheduleDisplay() {
            const scheduleBody = document.getElementById('schedule-body');
            scheduleBody.innerHTML = '';
            
            schedule.forEach((event, index) => {
                const row = document.createElement('tr');
                if (index === currentEventIndex) row.className = 'active';
                
                const status = index < currentEventIndex ? 
                    '<span style="color: var(--accent-green);">Selesai</span>' :
                    index === currentEventIndex ? 
                    '<span style="color: var(--accent-orange);">Aktif</span>' :
                    '<span style="color: var(--text-muted);">Terjadwal</span>';
                
                const direction = event.type === 'ARRIVAL' ? '→' : '←';
                const destination = `${event.from} ${direction} ${event.to}`;
                
                row.innerHTML = `
                    <td>${event.time}</td>
                    <td>${event.ka}</td>
                    <td>${event.loco}</td>
                    <td>${destination}</td>
                    <td>${status}</td>
                `;
                
                scheduleBody.appendChild(row);
            });
        }

        // Tutorial Progress Check
        function checkTutorialProgress(action) {
            if (gameState !== 'TUTORIAL') return;
            
            const step = tutorialSteps[tutorialStep];
            if (step && step.action === action) {
                if (step.validation && !step.validation()) {
                    logActivity("Aksi tidak sesuai dengan tutorial! Periksa kembali.", 'error');
                    return;
                }
                nextTutorial();
            }
        }

        // Event Listeners
        function setupEventListeners() {
            // Signal buttons
            ['masuk', 's1', 's2', 's3'].forEach(signal => {
                const btn = document.getElementById(`btn-signal-${signal}`);
                if (btn) btn.addEventListener('click', () => toggleSignal(signal));
            });

            // Wesel buttons
            [1, 2, 3].forEach(wesel => {
                const btn = document.getElementById(`btn-wesel-${wesel}`);
                if (btn) btn.addEventListener('click', () => switchWesel(wesel));
            });

            // Action buttons
            const actionButtons = {
                'btn-kereta-masuk': trainEnter,
                'btn-lepas-haluan': runAroundOperation,
                'btn-sambung-loko': reconnectLoco,
                'btn-berangkatkan': departTrain,
                'btn-lapor-stasiun': reportToNextStation,
                'btn-petunjuk': showHint,
                'btn-tutorial': showTutorial
            };

            Object.entries(actionButtons).forEach(([btnId, handler]) => {
                const btn = document.getElementById(btnId);
                if (btn) btn.addEventListener('click', handler);
            });

            // Tutorial controls
            document.getElementById('next-tutorial').addEventListener('click', nextTutorial);
            document.getElementById('close-tutorial').addEventListener('click', endTutorial);
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case '1':
                        case '2':
                        case '3':
                            e.preventDefault();
                            switchWesel(parseInt(e.key));
                            break;
                        case 'h':
                            e.preventDefault();
                            showHint();
                            break;
                        case 'Enter':
                            if (gameState === 'TUTORIAL') {
                                e.preventDefault();
                                nextTutorial();
                            }
                            break;
                    }
                }
            });
        }

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Initializing Enhanced Railway Station Simulator...');
            setupEventListeners();
            initGame();
            console.log('Game initialized successfully!');
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Game Error:', e.error);
            logActivity(`ERROR: ${e.message}`, 'error');
        });

        // Responsive handling
        window.addEventListener('resize', () => {
            // Adjust SVG viewbox for mobile
            const svg = document.getElementById('railway-map');
            const container = document.querySelector('.map-container');
            if (window.innerWidth <= 768) {
                svg.setAttribute('viewBox', '200 400 800 800');
            } else {
                svg.setAttribute('viewBox', '0 0 1200 1600');
            }
        });

        // Performance monitoring
        let lastFrameTime = performance.now();
        function monitorPerformance() {
            const now = performance.now();
            const delta = now - lastFrameTime;
            
            if (delta > 50) { // If frame took more than 50ms
                console.warn(`Slow frame detected: ${delta}ms`);
            }
            
            lastFrameTime = now;
            requestAnimationFrame(monitorPerformance);
        }
        
        // Start performance monitoring in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            requestAnimationFrame(monitorPerformance);
        }