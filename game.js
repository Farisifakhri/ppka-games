// Railway Station Simulation - V7 with Randomized Schedule
class RailwayStationSimulator {
    constructor() {
        // Game State & Data
        this.gameState = 'LOADING';
        this.gameTime = new Date();
        this.currentEventIndex = 0;
        this.isWaitingForEvent = true;
        this.trainLocation = null;

        // Configuration
        this.config = { 
            GAME_SPEED: 800, 
            ANIMATION_SPEED_FACTOR: 150, 
            MAX_LOG_ENTRIES: 50,
            TIME_VARIATION_MINUTES: 5 // Kereta bisa lebih cepat/lambat hingga 5 menit
        };

        // Game Data
        this.weselStates = { 1: { position: 'J2_J3' }, 2: { position: 'J2' }, 3: { position: 'STRAIGHT' } };
        this.signalStates = { 'masuk': { aspect: 'RED' }, 's1': { aspect: 'RED' }, 's2': { aspect: 'RED' }, 's3': { aspect: 'RED' } };
        
        // Base schedule, will be randomized on init
        this.schedule = [
            { id: 'KA318_ARR', type: 'ARRIVAL', ka: '318', time: '07:15', from: 'Rangkasbitung', to: 'Merak', track: 2 },
            { id: 'KA319_DEP', type: 'DEPARTURE', ka: '319', time: '09:00', from: 'Merak', to: 'Rangkasbitung', track: 1 }
        ];

        // SVG Elements & Animation Paths
        this.svgDoc = null;
        this.trainElement = null;
        this.trackPaths = {
            entryToTrack2: [ { x: 700, y: 950 }, { x: 700, y: 720 }, { x: 700, y: 600 }, { x: 550, y: 600 } ],
            shuntTrack2To1: [ { x: 550, y: 600 }, { x: 800, y: 600 }, { x: 800, y: 500 }, { x: 550, y: 500 } ],
            track1ToExit: [ { x: 550, y: 500 }, { x: 400, y: 500 }, { x: -200, y: 500 } ]
        };

        this.init();
    }

    init() {
        try {
            this.initializeUI();
            this.setupEventListeners();
            this.initGame();
            console.log('Railway simulator initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorMessage('Gagal memuat simulasi');
        }
    }

    initGame() {
        this.randomizeSchedule(); // NEW: Randomize schedule times
        const [startHour, startMinute] = this.schedule[0].time.split(':');
        this.gameTime.setHours(parseInt(startHour), parseInt(startMinute) - 30, 0, 0);
        this.updateGameClock();
        this.updateStatusDisplays();
        this.updateScheduleDisplay();
        this.startGameClock();
        this.setGameState('WAITING');
        this.logActivity("Simulasi PPKA dimulai dengan jadwal acak.");
    }

    /**
     * NEW: Adds a random variation to each event's time
     */
    randomizeSchedule() {
        this.schedule.forEach(event => {
            const maxVar = this.config.TIME_VARIATION_MINUTES;
            const variation = Math.floor(Math.random() * (maxVar * 2 + 1)) - maxVar; // Random number between -maxVar and +maxVar
            
            const scheduledMinutes = this.parseTime(event.time);
            const realTotalMinutes = scheduledMinutes + variation;

            const realHours = Math.floor(realTotalMinutes / 60);
            const realMinutes = realTotalMinutes % 60;
            
            // Store the actual trigger time in a new property
            event.realTime = `${String(realHours).padStart(2, '0')}:${String(realMinutes).padStart(2, '0')}`;
        });
        console.log("Jadwal dengan waktu acak:", this.schedule);
    }

    // --- Core Game Loop ---
    startGameClock() {
        setInterval(() => {
            if (this.gameState === 'PAUSED') return;
            this.gameTime.setMinutes(this.gameTime.getMinutes() + 1);
            this.updateGameClock();
            this.checkScheduleEvents();
        }, this.config.GAME_SPEED);
    }

    checkScheduleEvents() {
        if (this.currentEventIndex >= this.schedule.length || !this.isWaitingForEvent) return;

        const nextEvent = this.schedule[this.currentEventIndex];
        const eventTime = this.parseTime(nextEvent.realTime); // Use the randomized time
        const currentTime = this.gameTime.getHours() * 60 + this.gameTime.getMinutes();

        if (currentTime >= eventTime) {
            this.isWaitingForEvent = false;
            
            if (nextEvent.type === 'ARRIVAL') {
                this.showNotification(`KA ${nextEvent.ka} (jadwal ${nextEvent.time}) siap masuk dari ${nextEvent.from}!`);
                this.setGameState('PREPARE_ARRIVAL');
            } else if (nextEvent.type === 'DEPARTURE') {
                if (this.trainLocation === nextEvent.track) {
                    this.showNotification(`KA ${nextEvent.ka} (jadwal ${nextEvent.time}) siap berangkat dari Jalur ${nextEvent.track}.`);
                    this.setGameState('READY_DEPARTURE');
                } else {
                    this.showNotification(`Info: KA ${nextEvent.ka} (jadwal ${nextEvent.time}) harus di Jalur ${nextEvent.track}. Lakukan langsiran.`);
                    this.setGameState('AWAITING_SHUNT');
                }
            }
        }
    }

    // --- User Actions ---
    trainEnter() {
        if (this.gameState !== 'PREPARE_ARRIVAL') return;
        if (this.weselStates[1].position !== 'J2_J3' || this.weselStates[2].position !== 'J2') { this.showNotification('GAGAL: Atur rute wesel ke Jalur 2', 'error'); return; }
        if (this.signalStates['masuk'].aspect !== 'GREEN') { this.showNotification('GAGAL: Sinyal Masuk harus HIJAU', 'error'); return; }

        const event = this.schedule[this.currentEventIndex];
        this.logActivity(`Memulai pergerakan KA ${event.ka} masuk stasiun...`);
        this.toggleSignal('masuk');

        this.animateTrain(this.trackPaths.entryToTrack2, () => {
            this.logActivity(`KA ${event.ka} telah tiba di Jalur ${event.track}.`);
            this.trainLocation = event.track;
            this.setGameState('TRAIN_ARRIVED');
            this.currentEventIndex++;
            this.updateScheduleDisplay();
            this.isWaitingForEvent = true;
        });
    }

    departTrain() {
        if (this.gameState !== 'READY_DEPARTURE') return;
        const event = this.schedule[this.currentEventIndex];
        const requiredSignal = `s${event.track}`;
        if (this.signalStates[requiredSignal].aspect !== 'GREEN') { this.showNotification(`GAGAL: Sinyal Keluar Jalur ${event.track} (S${event.track}) harus HIJAU`, 'error'); return; }

        this.logActivity(`Memberangkatkan KA ${event.ka} dari Jalur ${event.track}...`);
        this.toggleSignal(requiredSignal);

        this.animateTrain(this.trackPaths.track1ToExit, () => {
            this.logActivity(`KA ${event.ka} telah berangkat menuju ${event.to}.`);
            this.trainElement.style.visibility = 'hidden';
            this.trainLocation = null;
            this.setGameState('DEPARTED');
            this.currentEventIndex++;
            this.updateScheduleDisplay();
            
            if (this.currentEventIndex >= this.schedule.length) {
                this.showNotification("Semua jadwal telah selesai!", "success");
                this.setGameState("COMPLETED");
            } else { this.isWaitingForEvent = true; }
        });
    }

    shuntTrain() {
        if (this.gameState !== 'AWAITING_SHUNT') return;
        if (this.weselStates[1].position !== 'J1') { this.showNotification('GAGAL: Atur Wesel 1 ke "Lurus (ke Jalur 1)" untuk langsiran.', 'error'); return; }
        if (this.weselStates[2].position !== 'J2') { this.showNotification('GAGAL: Atur Wesel 2 ke "Lurus (ke Jalur 2)" untuk langsiran.', 'error'); return; }
        
        this.logActivity(`Memulai proses langsiran dari Jalur 2 ke Jalur 1...`);

        this.animateTrain(this.trackPaths.shuntTrack2To1, () => {
            const event = this.schedule[this.currentEventIndex];
            this.logActivity(`Langsiran selesai. KA ${event.ka} sekarang berada di Jalur 1.`);
            this.trainLocation = 1;
            
            if (this.trainLocation === event.track) {
                this.showNotification(`KA ${event.ka} siap berangkat dari Jalur ${event.track}.`, 'success');
                this.setGameState('READY_DEPARTURE');
            }
        });
    }

    // --- Animation & Controls ---
    animateTrain(path, onComplete) {
        if (!this.trainElement) { this.showErrorMessage("Error: Aset kereta tidak dapat ditemukan."); if (onComplete) onComplete(); return; }
        this.setGameState('ANIMATING');
        this.trainElement.style.visibility = 'visible';
        let currentSegment = 0;
        const move = () => {
            if (currentSegment >= path.length - 1) { if (onComplete) onComplete(); return; }
            const start = path[currentSegment], end = path[currentSegment + 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const duration = distance * (this.config.ANIMATION_SPEED_FACTOR / 100);
            let startTime = null;
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const ratio = Math.min(progress / duration, 1);
                this.trainElement.setAttribute('transform', `translate(${start.x + (end.x - start.x) * ratio}, ${start.y + (end.y - start.y) * ratio})`);
                if (progress < duration) { requestAnimationFrame(step); } 
                else { currentSegment++; requestAnimationFrame(move); }
            };
            requestAnimationFrame(step);
        };
        requestAnimationFrame(move);
    }
    
    toggleSignal(signalId) {
        if (this.gameState === 'ANIMATING') return;
        const signal = this.signalStates[signalId];
        signal.aspect = (signal.aspect === 'RED') ? 'GREEN' : 'RED';
        this.updateSignalDisplay(signalId);
        this.updateStatusDisplays();
        this.logActivity(`Sinyal ${signalId.toUpperCase()} -> ${signal.aspect}`);
    }

    switchWesel(weselNum) {
        if (this.gameState === 'ANIMATING') return;
        const wesel = this.weselStates[weselNum];
        wesel.position = this.getWeselStates(weselNum)[(this.getWeselStates(weselNum).indexOf(wesel.position) + 1) % this.getWeselStates(weselNum).length];
        this.logActivity(`Wesel ${weselNum} -> ${this.getWeselDescription(weselNum, wesel.position)}`);
        this.updateStatusDisplays();
    }

    // --- UI & State Management ---
    setGameState(newState) {
        this.gameState = newState;
        const indicator = document.getElementById('game-state-indicator');
        indicator.textContent = newState.replace('_', ' ');
        indicator.classList.toggle('animating', newState === 'ANIMATING');
        this.updateButtonStates();
    }

    updateButtonStates() {
        const isAnimating = this.gameState === 'ANIMATING';
        document.querySelectorAll('.game-btn').forEach(btn => btn.disabled = isAnimating);
    }
    
    initializeUI() {
        const createButtons = (containerSelector, buttons) => {
            document.querySelector(containerSelector).innerHTML = buttons.map(btn => `<button class="game-btn ${btn.class || ''}" id="${btn.id}"><i class="${btn.icon}"></i> ${btn.label}</button>`).join('');
        };
        createButtons('.control-section:nth-child(1) .button-grid', [
            { id: 'btn-signal-masuk', icon: 'fas fa-arrow-down', label: 'S. Masuk', class: 'signal-red' },
            { id: 'btn-signal-s1', icon: 'fas fa-arrow-up', label: 'S1', class: 'signal-red' }, { id: 'btn-signal-s2', icon: 'fas fa-arrow-up', label: 'S2', class: 'signal-red' }, { id: 'btn-signal-s3', icon: 'fas fa-arrow-up', label: 'S3', class: 'signal-red' }
        ]);
        createButtons('.control-section:nth-child(2) .button-grid', [
            { id: 'btn-wesel-1', icon: 'fas fa-random', label: 'Wesel 1' }, { id: 'btn-wesel-2', icon: 'fas fa-random', label: 'Wesel 2' }, { id: 'btn-wesel-3', icon: 'fas fa-random', label: 'Wesel 3' }
        ]);
        createButtons('.control-section:nth-child(3) .button-grid', [
             { id: 'btn-kereta-masuk', icon: 'fas fa-train', label: 'Kereta Masuk' }, { id: 'btn-kereta-berangkat', icon: 'fas fa-sign-out-alt', label: 'Berangkatkan' }, { id: 'btn-kereta-langsir', icon: 'fas fa-exchange-alt', label: 'Langsir' }
        ]);
        const svgObject = document.getElementById('stasiun');
        svgObject.addEventListener('load', () => {
            this.svgDoc = svgObject.contentDocument;
            this.trainElement = this.svgDoc.getElementById('train-group');
            if (!this.trainElement) this.showErrorMessage('Aset kereta tidak dapat ditemukan di peta.');
        });
    }

    setupEventListeners() {
        document.getElementById('control-panel').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || !btn.id) return;
            const parts = btn.id.split('-'), category = parts[1], name = parts[2];
            if (category === 'signal') this.toggleSignal(name);
            else if (category === 'wesel') this.switchWesel(parseInt(name));
            else if (category === 'kereta') {
                if (name === 'masuk') this.trainEnter();
                if (name === 'berangkat') this.departTrain();
                if (name === 'langsir') this.shuntTrain();
            }
        });
    }

    // --- UI Display Updates ---
    updateGameClock() { document.getElementById('game-clock-display').textContent = `Pukul ${this.formatTime(this.gameTime)}`; }
    updateSignalDisplay(id) {
        const btn = document.getElementById(`btn-signal-${id}`);
        if(btn) { btn.classList.toggle('signal-green', this.signalStates[id].aspect === 'GREEN'); btn.classList.toggle('signal-red', this.signalStates[id].aspect === 'RED'); }
    }
    updateStatusDisplays() {
        document.getElementById('wesel-status-display').innerHTML = Object.entries(this.weselStates).map(([num, state]) => `<div>Wesel ${num}: <strong>${this.getWeselDescription(parseInt(num), state.position)}</strong></div>`).join('');
        document.getElementById('signal-status-display').innerHTML = Object.entries(this.signalStates).map(([id, state]) => `<div>${id.toUpperCase()}: <strong class="${state.aspect.toLowerCase()}">${state.aspect}</strong></div>`).join('');
    }
    updateScheduleDisplay() {
        document.getElementById('schedule-display').innerHTML = this.schedule.map((event, index) => {
            let status = 'Terjadwal';
            if (index < this.currentEventIndex) status = 'Selesai';
            else if (index === this.currentEventIndex && !this.isWaitingForEvent) status = 'Aktif';
            return `<div class="schedule-item ${status === 'Aktif' ? 'active' : ''}"><strong>KA ${event.ka}</strong> - ${event.time} <i>(Aktual: ${event.realTime})</i><br><span>${event.from} → ${event.to}</span><br><small>Status: ${status}</small></div>`;
        }).join('');
    }

    // --- Utility & Logging ---
    logActivity(msg) {
        const log = document.getElementById('activity-log');
        log.insertAdjacentHTML('afterbegin', `<li><strong>[${this.formatTime(this.gameTime)}]</strong> ${msg}</li>`);
        if (log.children.length > this.config.MAX_LOG_ENTRIES) log.removeChild(log.lastChild);
    }
    showNotification(msg, type = 'info', duration = 4000) {
        const container = document.getElementById('notification-container'), notification = document.createElement('div');
        notification.className = `notification ${type}`; notification.innerHTML = `<span>${msg}</span>`;
        container.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    }
    showErrorMessage(msg) { this.showNotification(msg, 'error', 6000); console.error('Game Error:', msg); }
    formatTime = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    parseTime = (str) => { const [h, m] = str.split(':'); return parseInt(h) * 60 + parseInt(m); };
    getWeselStates = (num) => ({ 1: ['J1', 'J2_J3'], 2: ['J2', 'J3'], 3: ['STRAIGHT', 'SIDING'] }[num] || []);
    getWeselDescription = (num, pos) => ({ 1: { 'J1': 'Lurus (ke Jalur 1)', 'J2_J3': 'Belok (ke Jalur 2/3)' }, 2: { 'J2': 'Lurus (ke Jalur 2)', 'J3': 'Belok (ke Jalur 3)' }, 3: { 'STRAIGHT': 'Lurus', 'SIDING': 'Sepur Badug' } }[num]?.[pos] || 'Unknown');
}

document.addEventListener('DOMContentLoaded', () => { window.railwayGame = new RailwayStationSimulator(); });