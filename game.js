// Railway Station Simulation - Fixed Basic Version
class RailwayStationSimulator {
    constructor() {
        // Basic Game State
        this.gameState = 'LOADING';
        this.tutorialStep = 0;
        this.gameTime = new Date();
        this.gameInterval = null;
        this.currentEventIndex = 0;
        this.isWaitingForEvent = false;
        this.soundEnabled = true;

        // Basic Configuration
        this.config = {
            GAME_SPEED: 800,           // ms per game minute
            ANIMATION_SPEED: 3,        // seconds for train movements
            MAX_LOG_ENTRIES: 50        // Maximum log entries to keep
        };

        // Simple State Management
        this.weselStates = {
            1: { position: 'J2_J3', isLocked: false },
            2: { position: 'J2', isLocked: false },
            3: { position: 'STRAIGHT', isLocked: false }
        };

        this.signalStates = {
            'masuk': { active: false, aspect: 'RED' },
            's1': { active: false, aspect: 'RED' },
            's2': { active: false, aspect: 'RED' },
            's3': { active: false, aspect: 'RED' }
        };

        // Basic Schedule
        this.schedule = [
            {
                id: 'KA318_ARR',
                type: 'ARRIVAL',
                ka: '318',
                time: '07:15',
                from: 'Rangkasbitung',
                to: 'Merak',
                track: 2
            },
            {
                id: 'KA319_DEP',
                type: 'DEPARTURE',
                ka: '319',
                time: '09:00',
                from: 'Merak',
                to: 'Rangkasbitung',
                track: 1
            }
        ];

        // Basic Tutorial Steps
        this.tutorialSteps = [
            {
                id: 'welcome',
                text: "Selamat datang di Simulasi Stasiun Merak! Anda bertugas sebagai PPKA."
            },
            {
                id: 'prepare_wesel1',
                text: "Atur Wesel 1 ke posisi 'Jalur 1/2' untuk rute kedatangan."
            },
            {
                id: 'prepare_wesel2',
                text: "Atur Wesel 2 ke 'Jalur 2' untuk jalur kedatangan KA 318."
            },
            {
                id: 'signal_masuk',
                text: "Beri aspek HIJAU pada Sinyal Masuk."
            },
            {
                id: 'train_entry',
                text: "Klik 'Kereta Masuk' untuk menerima kedatangan."
            },
            {
                id: 'tutorial_complete',
                text: "Tutorial selesai! Anda siap beroperasi."
            }
        ];

        this.init();
    }

    // Basic Initialization
    init() {
        try {
            this.setupEventListeners();
            this.initializeUI();
            this.initGame();
            
            console.log('Railway simulator initialized');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorMessage('Gagal memuat simulasi');
        }
    }

    // Basic Game Setup
    initGame() {
        // Set initial time
        const [startHour, startMinute] = this.schedule[0].time.split(':');
        this.gameTime.setHours(parseInt(startHour), parseInt(startMinute) - 30, 0, 0);

        this.updateGameClock();
        this.updateStatusDisplays();
        this.updateScheduleDisplay();
        this.updateButtonStates();
        this.startGameClock();

        this.gameState = 'TUTORIAL';
        this.showTutorial();

        this.logActivity("Simulasi PPKA dimulai");
    }

    // Basic Game Clock
    startGameClock() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        
        this.gameInterval = setInterval(() => {
            if (this.gameState === 'PAUSED') return;
            
            this.gameTime.setMinutes(this.gameTime.getMinutes() + 1);
            this.updateGameClock();
            this.checkScheduleEvents();
            
        }, this.config.GAME_SPEED);
    }

    updateGameClock() {
        const timeString = this.formatTime(this.gameTime);
        const clockElement = document.getElementById('game-clock-display');
        if (clockElement) {
            clockElement.textContent = `Pukul ${timeString}`;
        }
    }

    // Basic Schedule Events
    checkScheduleEvents() {
        if (this.currentEventIndex >= this.schedule.length || this.isWaitingForEvent) return;

        const nextEvent = this.schedule[this.currentEventIndex];
        const eventTime = this.parseTime(nextEvent.time);
        const currentTime = this.gameTime.getHours() * 60 + this.gameTime.getMinutes();

        if (currentTime >= eventTime) {
            this.isWaitingForEvent = true;
            this.handleScheduleEvent(nextEvent);
        }
    }

    parseTime(timeString) {
        const [hour, minute] = timeString.split(':');
        return parseInt(hour) * 60 + parseInt(minute);
    }

    handleScheduleEvent(event) {
        if (event.type === 'ARRIVAL') {
            this.showNotification(`KA ${event.ka} dari ${event.from} siap masuk!`);
            this.gameState = 'PREPARE_ARRIVAL';
            this.updateButtonStates();
        }
    }

    // Basic Signal Control
    toggleSignal(signalId) {
        if (this.gameState === 'ANIMATING') {
            this.showNotification('Tunggu operasi selesai');
            return;
        }

        const signal = this.signalStates[signalId];
        if (!signal) return;

        signal.active = !signal.active;
        signal.aspect = signal.active ? 'GREEN' : 'RED';

        this.updateSignalDisplay(signalId);
        this.updateStatusDisplays();

        const status = signal.active ? 'HIJAU' : 'MERAH';
        this.logActivity(`Sinyal ${signalId.toUpperCase()} -> ${status}`);
        
        this.playSound('signal');
        this.checkTutorialProgress('signal-' + signalId);
    }

    updateSignalDisplay(signalId) {
        // Basic visual feedback for signals
        const button = document.getElementById(`btn-signal-${signalId}`);
        if (button) {
            const signal = this.signalStates[signalId];
            if (signal.active) {
                button.classList.add('signal-green');
                button.classList.remove('signal-red');
            } else {
                button.classList.add('signal-red');
                button.classList.remove('signal-green');
            }
        }
    }

    // Basic Wesel Control
    switchWesel(weselNum) {
        if (this.gameState === 'ANIMATING') {
            this.showNotification('Tunggu operasi selesai');
            return;
        }

        const wesel = this.weselStates[weselNum];
        if (wesel.isLocked) {
            this.showNotification(`Wesel ${weselNum} terkunci`);
            return;
        }

        const states = this.getWeselStates(weselNum);
        const currentIndex = states.indexOf(wesel.position);
        const nextIndex = (currentIndex + 1) % states.length;
        
        wesel.position = states[nextIndex];

        const description = this.getWeselDescription(weselNum, wesel.position);
        this.logActivity(`Wesel ${weselNum} -> ${description}`);
        
        this.updateStatusDisplays();
        this.playSound('wesel');
        this.checkTutorialProgress('wesel-' + weselNum);
    }

    // Basic Train Operations
    trainEnter() {
        if (this.gameState !== 'PREPARE_ARRIVAL' && this.gameState !== 'TUTORIAL') {
            this.showNotification('Tidak dapat menerima kereta sekarang');
            return;
        }

        // Basic route validation
        if (this.weselStates[1].position !== 'J2_J3') {
            this.showNotification('GAGAL: Wesel 1 harus ke Jalur 1/2');
            return;
        }
        if (this.weselStates[2].position !== 'J2') {
            this.showNotification('GAGAL: Wesel 2 harus ke Jalur 2');
            return;
        }
        if (!this.signalStates.masuk.active) {
            this.showNotification('GAGAL: Sinyal Masuk harus hijau');
            return;
        }

        const event = this.schedule[this.currentEventIndex];
        this.logActivity(`KA ${event.ka} masuk ke stasiun`);

        // Reset entry signal
        this.signalStates.masuk.active = false;
        this.signalStates.masuk.aspect = 'RED';
        this.updateSignalDisplay('masuk');

        this.gameState = 'TRAIN_ARRIVED';
        this.updateButtonStates();
        this.checkTutorialProgress('kereta-masuk');
        this.playSound('success');
    }

    departTrain() {
        if (this.gameState !== 'READY_DEPARTURE') {
            this.showNotification('Kereta belum siap berangkat');
            return;
        }

        const event = this.schedule[this.currentEventIndex];
        this.logActivity(`KA ${event.ka} berangkat`);

        this.gameState = 'DEPARTED';
        this.updateButtonStates();
        this.playSound('success');
    }

    reportToNextStation() {
        if (this.gameState !== 'DEPARTED') {
            this.showNotification('Belum ada kereta untuk dilaporkan');
            return;
        }

        this.logActivity("Laporan terkirim ke stasiun berikutnya");
        
        this.isWaitingForEvent = false;
        this.currentEventIndex++;
        this.updateScheduleDisplay();

        if (this.currentEventIndex >= this.schedule.length) {
            this.gameState = 'COMPLETED';
            this.showNotification('Semua operasi selesai!');
        } else {
            this.gameState = 'WAITING';
        }

        this.updateButtonStates();
    }

    // Basic Audio System
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        try {
            // Simple beep sounds
            const frequencies = {
                signal: 800,
                wesel: 400,
                success: 1000,
                error: 200
            };
            
            const freq = frequencies[soundName] || 600;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            
        } catch (error) {
            console.warn('Audio not supported');
        }
    }

    // Basic Button State Management
    updateButtonStates() {
        const buttons = document.querySelectorAll('.game-btn');
        
        // Reset all buttons
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });

        // Tutorial mode
        if (this.gameState === 'TUTORIAL') {
            buttons.forEach(btn => btn.disabled = true);
            return;
        }

        // Disable buttons based on game state
        const disableMap = {
            'WAITING': ['btn-kereta-masuk'],
            'PREPARE_ARRIVAL': ['btn-berangkatkan', 'btn-lapor-stasiun'],
            'TRAIN_ARRIVED': ['btn-kereta-masuk'],
            'READY_DEPARTURE': ['btn-kereta-masuk'],
            'DEPARTED': ['btn-kereta-masuk', 'btn-berangkatkan'],
            'COMPLETED': ['btn-kereta-masuk', 'btn-berangkatkan', 'btn-lapor-stasiun']
        };

        const toDisable = disableMap[this.gameState] || [];
        toDisable.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });
    }

    // Basic Status Display
    updateStatusDisplays() {
        this.updateWeselStatus();
        this.updateSignalStatus();
    }

    updateWeselStatus() {
        const container = document.getElementById('wesel-status-display');
        if (!container) return;

        container.innerHTML = '';
        
        for (let i = 1; i <= 3; i++) {
            const wesel = this.weselStates[i];
            const description = this.getWeselDescription(i, wesel.position);
            
            const div = document.createElement('div');
            div.innerHTML = `Wesel ${i}: ${description}`;
            container.appendChild(div);
        }
    }

    updateSignalStatus() {
        const container = document.getElementById('signal-status-display');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.signalStates).forEach(([id, signal]) => {
            const div = document.createElement('div');
            div.innerHTML = `${id.toUpperCase()}: ${signal.aspect}`;
            container.appendChild(div);
        });
    }

    // Basic Schedule Display
    updateScheduleDisplay() {
        const display = document.getElementById('schedule-display');
        if (!display) return;

        let html = '<h3>Jadwal Kereta</h3>';
        
        this.schedule.forEach((event, index) => {
            const status = index < this.currentEventIndex ? 'Selesai' : 
                          index === this.currentEventIndex ? 'Aktif' : 'Terjadwal';
            
            html += `
                <div class="schedule-item ${index === this.currentEventIndex ? 'active' : ''}">
                    <strong>KA ${event.ka}</strong> - ${event.time}<br>
                    ${event.from} → ${event.to}<br>
                    <small>Status: ${status}</small>
                </div>
            `;
        });

        display.innerHTML = html;
    }

    // Basic Tutorial System
    showTutorial() {
        if (this.tutorialStep >= this.tutorialSteps.length) {
            this.endTutorial();
            return;
        }

        const step = this.tutorialSteps[this.tutorialStep];
        
        // Show tutorial message
        this.showNotification(step.text, 'info', 8000);
        
        this.updateButtonStates();
    }

    nextTutorial() {
        this.tutorialStep++;
        if (this.tutorialStep >= this.tutorialSteps.length) {
            this.endTutorial();
        } else {
            this.showTutorial();
        }
    }

    checkTutorialProgress(action) {
        if (this.gameState !== 'TUTORIAL') return;
        
        // Simple tutorial progression
        if (this.tutorialStep < this.tutorialSteps.length - 1) {
            setTimeout(() => this.nextTutorial(), 1000);
        }
    }

    endTutorial() {
        this.gameState = 'WAITING';
        this.updateButtonStates();
        this.showNotification("Tutorial selesai!");
        this.logActivity("Tutorial selesai. Mode operasi aktif.");
    }

    // Basic Notification System
    showNotification(message, type = 'info', duration = 5000) {
        // Create simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
        console.error('Game Error:', message);
    }

    // Basic Logging System
    logActivity(message, type = 'info') {
        const timestamp = this.formatTime(this.gameTime);
        const logContainer = document.getElementById('activity-log');
        
        if (logContainer) {
            const logItem = document.createElement('li');
            logItem.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
            
            logContainer.insertBefore(logItem, logContainer.firstChild);
            
            // Keep only recent logs
            while (logContainer.children.length > this.config.MAX_LOG_ENTRIES) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }

        console.log(`[${timestamp}] ${message}`);
    }

    // Basic UI Initialization
    initializeUI() {
        this.updateScheduleDisplay();
        this.updateStatusDisplays();
    }

    // Basic Event Listeners
    setupEventListeners() {
        // Signal buttons
        ['masuk', 's1', 's2', 's3'].forEach(signal => {
            const btn = document.getElementById(`btn-signal-${signal}`);
            if (btn) {
                btn.addEventListener('click', () => this.toggleSignal(signal));
            }
        });

        // Wesel buttons
        [1, 2, 3].forEach(wesel => {
            const btn = document.getElementById(`btn-wesel-${wesel}`);
            if (btn) {
                btn.addEventListener('click', () => this.switchWesel(wesel));
            }
        });

        // Action buttons
        const actionButtons = {
            'btn-kereta-masuk': () => this.trainEnter(),
            'btn-berangkatkan': () => this.departTrain(),
            'btn-lapor-stasiun': () => this.reportToNextStation(),
            'btn-reset-game': () => this.resetGame()
        };

        Object.entries(actionButtons).forEach(([btnId, handler]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1':
                    case '2':
                    case '3':
                        e.preventDefault();
                        this.switchWesel(parseInt(e.key));
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetGame();
                        break;
                }
            }
        });
    }

    // Utility Functions
    formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    getWeselStates(weselNum) {
        const states = {
            1: ['J1', 'J2_J3'],
            2: ['J2', 'J3'], 
            3: ['STRAIGHT', 'SIDING']
        };
        return states[weselNum] || [];
    }

    getWeselDescription(weselNum, position) {
        const descriptions = {
            1: { 'J1': 'Jalur 1', 'J2_J3': 'Jalur 1/2' },
            2: { 'J2': 'Jalur 2', 'J3': 'Jalur 1/3' },
            3: { 'STRAIGHT': 'Lurus', 'SIDING': 'Percabangan' }
        };
        return descriptions[weselNum]?.[position] || 'Unknown';
    }

    // Basic Game Reset
    resetGame() {
        if (confirm('Reset game? Progress akan hilang.')) {
            // Stop interval
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }
            
            // Reset states
            this.gameTime = new Date();
            this.currentEventIndex = 0;
            this.tutorialStep = 0;
            this.gameState = 'TUTORIAL';
            this.isWaitingForEvent = false;
            
            // Reset wesel positions
            this.weselStates[1].position = 'J2_J3';
            this.weselStates[2].position = 'J2';
            this.weselStates[3].position = 'STRAIGHT';
            
            // Reset signals
            Object.keys(this.signalStates).forEach(key => {
                this.signalStates[key].active = false;
                this.signalStates[key].aspect = 'RED';
                this.updateSignalDisplay(key);
            });

            // Clear log
            const logContainer = document.getElementById('activity-log');
            if (logContainer) {
                logContainer.innerHTML = '';
            }

            // Restart
            this.initGame();
            this.showNotification('Game berhasil direset');
        }
    }

    // Simple state transitions for basic game flow
    advanceGameState() {
        switch(this.gameState) {
            case 'TRAIN_ARRIVED':
                this.gameState = 'READY_DEPARTURE';
                this.logActivity("Kereta siap untuk berangkat");
                break;
        }
        this.updateButtonStates();
    }

    // Cleanup
    destroy() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Railway Station Simulator...');
    window.railwayGame = new RailwayStationSimulator();
});

// Error handler
window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
    if (window.railwayGame) {
        window.railwayGame.showErrorMessage(`Error: ${e.message}`);
    }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (window.railwayGame) {
        window.railwayGame.destroy();
    }
});