document.addEventListener("DOMContentLoaded", function() {
    const stasiunObject = document.getElementById("stasiun");

    const onSvgLoaded = () => {
        const svgDoc = stasiunObject.contentDocument;
        if (!svgDoc) {
            console.error("Gagal memuat konten SVG.");
            return;
        }
        initializeGame(svgDoc);
    };

    if (stasiunObject.contentDocument && stasiunObject.contentDocument.readyState === 'complete') {
        onSvgLoaded();
    } else {
        stasiunObject.addEventListener("load", onSvgLoaded);
    }

    function initializeGame(svgDoc) {
        // --- KUMPULKAN SEMUA ELEMEN PENTING ---
        const signals = {
            S_in: { light: svgDoc.getElementById("S_in"), name: "Sinyal Masuk" },
            S1_out: { light: svgDoc.getElementById("S1_out"), name: "S1 Keluar" },
            S2_out: { light: svgDoc.getElementById("S2_out"), name: "S2 Keluar" },
            S3_out: { light: svgDoc.getElementById("S3_out"), name: "S3 Keluar" },
            S1_langsir: { light: svgDoc.getElementById("S1_langsir"), name: "Langsir 1" },
            S2_langsir: { light: svgDoc.getElementById("S2_langsir"), name: "Langsir 2" }
        };
        const wesels = {
            W1_to_J1: svgDoc.getElementById("W1_to_J1"), W1_to_J2J3: svgDoc.getElementById("W1_to_J2J3"),
            W2_to_J2: svgDoc.getElementById("W2_to_J2"), W2_to_J3: svgDoc.getElementById("W2_to_J3"),
            W3_to_J2_straight: svgDoc.getElementById("W3_to_J2_straight"), W3_to_J1_siding: svgDoc.getElementById("W3_to_J1_siding")
        };
        const train = svgDoc.getElementById("train");
        const locomotive = svgDoc.getElementById("locomotive");
        const carriages = svgDoc.getElementById("carriages");
        const rute = {
            masuk_J2: svgDoc.getElementById('route_masuk_J2'),
            J2_to_siding: svgDoc.getElementById('route_J2_to_siding'),
            siding_to_krenceng: svgDoc.getElementById('route_siding_to_krenceng'),
            krenceng_to_J2_head: svgDoc.getElementById('route_krenceng_to_J2_head')
        };
        const info = {
            weselStatus: document.getElementById('wesel-status-display'),
            signalStatus: document.getElementById('signal-status-display'),
            log: document.getElementById('activity-log'),
            gameClock: document.getElementById('game-clock-display'),
            scheduleDisplay: document.getElementById('schedule-display')
        };
        const currentLocoShapeRef = svgDoc.getElementById("current-loco-shape");
        const controlPanel = document.getElementById("control-panel");

        // --- MANAJEMEN STATUS GAME & WAKTU ---
        let gameState = 'READY_TO_DEPART';
        let wesel1Posisi = 'J2&J3';
        let wesel2Posisi = 'J2';
        let wesel3Posisi = 'J2_STRAIGHT';
        let buttons = {};
        let gameTime = new Date();
        let gameClockInterval;
        let currentEventIndex = 0;
        const schedule = [
            { type: 'DEPARTURE', ka: '311', loco: 'CC201', time: '05:05', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '318', loco: 'CC203', time: '07:15', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '319', loco: 'CC203', time: '07:45', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '312', loco: 'CC206', time: '09:15', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '313', loco: 'CC206', time: '10:05', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '320', loco: 'CC201', time: '11:55', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '321', loco: 'CC201', time: '12:44', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '314', loco: 'CC206', time: '15:42', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '315', loco: 'CC206', time: '16:40', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '322', loco: 'CC203', time: '18:30', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '323', loco: 'CC203', time: '19:00', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '316', loco: 'CC201', time: '20:50', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '317', loco: 'CC201', time: '21:20', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '324', loco: 'CC206', time: '23:10', from: 'Rangkasbitung', to: 'Merak' }
        ];

        // --- FUNGSI-FUNGSI GAME ---
        function logActivity(message, isError = false) {
            const li = document.createElement('li');
            li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            if (isError) { li.classList.add('error'); }
            info.log.insertBefore(li, info.log.firstChild);
        }

        function updateStatusDashboard() {
            info.weselStatus.innerHTML = `<p><strong>Wesel 1:</strong> ${wesel1Posisi === 'J1' ? 'BELOK (ke J1)' : 'LURUS (ke J2/3)'}</p>
                                          <p><strong>Wesel 2:</strong> ${wesel2Posisi === 'J2' ? 'LURUS (ke J2)' : 'BELOK (ke J3)'}</p>
                                          <p><strong>Wesel 3:</strong> ${wesel3Posisi === 'J1_SIDING' ? 'BELOK (ke Sepur Badug)' : 'LURUS (di Jalur 2)'}</p>`;
            info.signalStatus.innerHTML = Object.values(signals).map(data => {
                if (!data.light) return `<p>${data.name}: <span style="color: grey;">Tidak Ditemukan</span></p>`;
                const isGreen = data.light.getAttribute('fill') === '#22c55e';
                return `<p>${data.name}: <span class="status-light ${isGreen ? 'light-green' : 'light-red'}"></span></p>`;
            }).join('');
        }

        function updateTombol() {
            buttons.keretaMasuk.disabled = gameState !== 'IDLE';
            buttons.lepasLoko.disabled = gameState !== 'ARRIVED_ON_J2';
            buttons.langsirKeluar.disabled = gameState !== 'LOCO_ON_SIDING';
            buttons.kembaliKeRangkaian.disabled = gameState !== 'LOCO_SHUNTED';
            buttons.berangkatkanKereta.disabled = gameState !== 'READY_TO_DEPART';
            buttons.laporKrenceng.disabled = gameState !== 'TRAIN_DEPARTED';
        }
        
        function animateElement(element, path, duration, onEnd) {
            const oldAnimation = element.querySelector("animateMotion");
            if (oldAnimation) oldAnimation.remove();
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            animate.setAttribute("dur", `${duration}s`);
            animate.setAttribute("path", path.getAttribute("d"));
            animate.setAttribute("fill", "freeze");
            animate.setAttribute("rotate", "auto");
            element.appendChild(animate);
            animate.beginElement();
            setTimeout(onEnd, duration * 1000);
        }

        function checkSignal(signalId) {
            const signalData = signals[signalId];
            if (!signalData || !signalData.light) return false;
            return signalData.light.getAttribute('fill') === '#22c55e';
        }

        function setSignal(id, color) {
            const signalData = signals[id];
            if (!signalData || !signalData.light) return;
            const targetColor = color === 'green' ? '#22c55e' : '#ef4444';
            signalData.light.setAttribute("fill", targetColor);
            logActivity(`Sinyal ${signalData.name} otomatis diatur ke ${color === 'green' ? 'AMAN' : 'BERHENTI'}.`);
            updateStatusDashboard();
        }

        function gerakkanWesel1() {
            wesel1Posisi = (wesel1Posisi === 'J1') ? 'J2&J3' : 'J1';
            wesels.W1_to_J1.classList.toggle('hidden');
            wesels.W1_to_J2J3.classList.toggle('hidden');
            logActivity(`Wesel 1 diubah ke arah ${wesel1Posisi === 'J1' ? 'Jalur 1' : 'Jalur 2 & 3'}.`);
            updateStatusDashboard();
        }

        function gerakkanWesel2() {
            wesel2Posisi = (wesel2Posisi === 'J2') ? 'J3' : 'J2';
            wesels.W2_to_J3.classList.toggle('hidden');
            wesels.W2_to_J2.classList.toggle('hidden');
            logActivity(`Wesel 2 diubah ke arah ${wesel2Posisi === 'J2' ? 'Jalur 2' : 'Jalur 3'}.`);
            updateStatusDashboard();
        }

        function gerakkanWesel3() {
            wesel3Posisi = (wesel3Posisi === 'J2_STRAIGHT') ? 'J1_SIDING' : 'J2_STRAIGHT';
            wesels.W3_to_J2_straight.classList.toggle('hidden');
            wesels.W3_to_J1_siding.classList.toggle('hidden');
            logActivity(`Wesel 3 diubah ke arah ${wesel3Posisi === 'J1_SIDING' ? 'Sepur Badug J1' : 'Lurus J2'}.`);
            updateStatusDashboard();
        }

        function toggleSignal(id) {
            const signalData = signals[id];
            if (!signalData || !signalData.light) return;
            const isRed = signalData.light.getAttribute("fill") === "#ef4444";
            signalData.light.setAttribute("fill", isRed ? "#22c55e" : "#ef4444");
            logActivity(`Sinyal ${signalData.name} diubah menjadi ${isRed ? 'AMAN (Hijau)' : 'BERHENTI (Merah)'}.`);
            updateStatusDashboard();
        }

        function formatTime(date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        function updateGameClock() {
            gameTime.setSeconds(gameTime.getSeconds() + 6);
            info.gameClock.textContent = `Pukul ${formatTime(gameTime)}`;
            if ((gameState === 'WAITING_FOR_NEXT_TRAIN' || gameState === 'IDLE' || gameState === 'ARRIVED_ON_J2') && currentEventIndex < schedule.length) {
                const nextEvent = schedule[currentEventIndex];
                const [eventHour, eventMinute] = nextEvent.time.split(':');
                if (gameTime.getHours() >= parseInt(eventHour) && gameTime.getMinutes() >= parseInt(eventMinute)) {
                    if (nextEvent.type === 'ARRIVAL') {
                        if (gameState !== 'IDLE') {
                            setLocoType(nextEvent.loco);
                            logActivity(`PERHATIAN: KA ${nextEvent.ka} (${nextEvent.loco}) dari ${nextEvent.from} akan masuk. Siapkan rute!`);
                            gameState = 'IDLE';
                            updateTombol();
                            populateScheduleBoard();
                        }
                    } else if (nextEvent.type === 'DEPARTURE') {
                        if (gameState !== 'READY_TO_DEPART') {
                            setLocoType(nextEvent.loco);
                            logActivity(`WAKTUNYA BERANGKAT: KA ${nextEvent.ka} (${nextEvent.loco}) ke ${nextEvent.to} siap diberangkatkan.`);
                            gameState = 'READY_TO_DEPART';
                            train.style.visibility = 'visible';
                            locomotive.querySelector('use').setAttribute('transform', '');
                            updateTombol();
                            populateScheduleBoard();
                        }
                    }
                }
            }
        }

        function initGameClock() {
            const [startHour, startMinute] = schedule[0].time.split(':');
            gameTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
            info.gameClock.textContent = `Pukul ${formatTime(gameTime)}`;
            gameClockInterval = setInterval(updateGameClock, 1000);
        }

        function populateScheduleBoard() {
             let html = '<table><thead><tr><th>Waktu</th><th>KA</th><th>Loko</th><th>Dari/Ke</th><th style="text-align:center;">Jenis</th></tr></thead><tbody>';
            schedule.forEach((event, index) => {
                const className = (index === currentEventIndex) ? 'class="active-train"' : '';
                const destination = event.type === 'ARRIVAL' ? event.from : event.to;
                const typeLabel = event.type === 'ARRIVAL' ? 'DATANG' : 'BERANGKAT';
                html += `<tr ${className}><td>${event.time}</td><td>${event.ka}</td><td>${event.loco}</td><td>${destination}</td><td style="text-align:center;">${typeLabel}</td></tr>`;
            });
            html += '</tbody></table>';
            info.scheduleDisplay.innerHTML = html;
        }
        
        function setLocoType(type) {
            let shapeId = '#loco-cc201-shape';
            switch (type.toUpperCase()) {
                case 'CC201': shapeId = '#loco-cc201-shape'; break;
                case 'CC203': shapeId = '#loco-cc203-shape'; break;
                case 'CC206': shapeId = '#loco-cc206-shape'; break;
            }
            if(currentLocoShapeRef) {
                currentLocoShapeRef.setAttribute('xlink:href', shapeId);
            }
        }

        function createButtons() {
            controlPanel.innerHTML = `
                <div class="button-group">
                    <button id="btn-toggle-S_in" class="btn-signal"><i class="fa-solid fa-traffic-light"></i> S-Masuk</button>
                    <button id="btn-toggle-S1_out" class="btn-signal"><i class="fa-solid fa-arrow-up"></i> S1-Keluar</button>
                    <button id="btn-toggle-S2_out" class="btn-signal"><i class="fa-solid fa-arrow-up"></i> S2-Keluar</button>
                    <button id="btn-toggle-S1_langsir" class="btn-signal-langsir"><i class="fa-solid fa-person-walking-arrow-loop-left"></i> Langsir 1</button>
                    <button id="btn-toggle-S2_langsir" class="btn-signal-langsir"><i class="fa-solid fa-person-walking-arrow-loop-left"></i> Langsir 2</button>
                </div>
                <div class="button-group">
                    <button id="btn-switch-wesel1" class="btn-switch"><i class="fa-solid fa-code-branch"></i> Wesel 1</button>
                    <button id="btn-switch-wesel2" class="btn-switch"><i class="fa-solid fa-code-branch"></i> Wesel 2</button>
                    <button id="btn-switch-wesel3" class="btn-switch"><i class="fa-solid fa-shuffle"></i> Wesel 3 (Langsir)</button>
                </div>
                <div class="button-group">
                    <button id="btn-kereta-masuk" class="btn-action"><i class="fa-solid fa-train"></i> Kereta Masuk</button>
                    <button id="btn-lepas-loko" class="btn-langsir" disabled><i class="fa-solid fa-unlink"></i> Lepas Loko</button>
                    <button id="btn-langsir-keluar" class="btn-langsir" disabled><i class="fa-solid fa-route"></i> Langsir Keluar</button>
                    <button id="btn-kembali-ke-rangkaian" class="btn-langsir" disabled><i class="fa-solid fa-link"></i> Kembali</button>
                    <button id="btn-berangkatkan-kereta" class="btn-action" disabled><i class="fa-solid fa-train-tram"></i> Berangkatkan</button>
                    <button id="btn-lapor-krenceng" class="btn-action" disabled><i class="fa-solid fa-phone-volume"></i> Lapor St. Berikutnya</button>
                </div>
            `;
            buttons = {
                keretaMasuk: document.getElementById('btn-kereta-masuk'), lepasLoko: document.getElementById('btn-lepas-loko'),
                langsirKeluar: document.getElementById('btn-langsir-keluar'), kembaliKeRangkaian: document.getElementById('btn-kembali-ke-rangkaian'),
                berangkatkanKereta: document.getElementById('btn-berangkatkan-kereta'), wesel1: document.getElementById('btn-switch-wesel1'),
                wesel2: document.getElementById('btn-switch-wesel2'), wesel3: document.getElementById('btn-switch-wesel3'),
                laporKrenceng: document.getElementById('btn-lapor-krenceng')
            };
        }

        function attachEventListeners() {
            Object.keys(signals).forEach(id => {
                const btn = document.getElementById(`btn-toggle-${id}`);
                if (btn) btn.addEventListener("click", () => toggleSignal(id));
            });
            buttons.wesel1.addEventListener('click', gerakkanWesel1);
            buttons.wesel2.addEventListener('click', gerakkanWesel2);
            buttons.wesel3.addEventListener('click', gerakkanWesel3);
            buttons.keretaMasuk.addEventListener('click', () => {
                if (gameState !== 'IDLE' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S_in')) {
                    logActivity("GAGAL: Syarat kereta masuk tidak terpenuhi!", true); return;
                }
                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) mulai masuk ke Jalur 2...`);
                gameState = 'ANIMATING'; updateTombol();
                train.style.visibility = "visible";
                animateElement(train, rute.masuk_J2, 60, () => {
                    setSignal('S_in', 'red');
                    gameState = 'ARRIVED_ON_J2';
                    logActivity(`KA ${event.ka} telah tiba di Jalur 2.`);
                    currentEventIndex++;
                    populateScheduleBoard();
                    updateTombol();
                });
            });
            buttons.lepasLoko.addEventListener('click', () => {
                if (gameState !== 'ARRIVED_ON_J2' || wesel3Posisi !== 'J1_SIDING' || !checkSignal('S2_langsir')) {
                    logActivity("GAGAL: Syarat lepas lokomotif tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif dilepas dan bergerak ke sepur badug..."); gameState = 'ANIMATING'; updateTombol();
                carriages.style.visibility = 'hidden';
                locomotive.style.visibility = 'visible';
                train.style.visibility = 'hidden';
                animateElement(locomotive, rute.J2_to_siding, 25, () => {
                    setSignal('S2_langsir', 'red');
                    gameState = 'LOCO_ON_SIDING';
                    logActivity("Lokomotif telah tiba di sepur badug.");
                    updateTombol();
                });
            });
            buttons.langsirKeluar.addEventListener('click', () => {
                if (gameState !== 'LOCO_ON_SIDING' || wesel3Posisi !== 'J2_STRAIGHT' || wesel1Posisi !== 'J1' || !checkSignal('S1_langsir') || !checkSignal('S1_out')) {
                    logActivity("GAGAL: Syarat langsir keluar tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif mulai langsir keluar stasiun via Jalur 1..."); gameState = 'ANIMATING'; updateTombol();
                animateElement(locomotive, rute.siding_to_krenceng, 45, () => {
                    setSignal('S1_langsir', 'red'); setSignal('S1_out', 'red');
                    gameState = 'LOCO_SHUNTED';
                    logActivity("Lokomotif berhasil langsir keluar.");
                    updateTombol();
                });
            });
            buttons.kembaliKeRangkaian.addEventListener('click', () => {
                if (gameState !== 'LOCO_SHUNTED' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S_in')) {
                    logActivity("GAGAL: Syarat lokomotif kembali tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif kembali untuk dirangkai..."); gameState = 'ANIMATING'; updateTombol();
                animateElement(locomotive, rute.krenceng_to_J2_head, 60, () => {
                    setSignal('S_in', 'red');
                    locomotive.style.visibility = 'hidden';
                    carriages.style.visibility = 'visible';
                    train.style.visibility = 'visible';
                    locomotive.querySelector('use').setAttribute('transform', 'rotate(180)');
                    gameState = 'READY_TO_DEPART';
                    logActivity("Kereta telah dirangkai dan siap berangkat.");
                    updateTombol();
                });
            });
            buttons.berangkatkanKereta.addEventListener('click', () => {
                if (gameState !== 'READY_TO_DEPART' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S2_out')) {
                    logActivity("GAGAL: Syarat keberangkatan tidak terpenuhi!", true); return;
                }
                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) diberangkatkan menuju ${event.to}...`);
                gameState = 'ANIMATING'; updateTombol();
                animateElement(train, rute.masuk_J2, 60, () => {
                    train.style.visibility = 'hidden';
                    setSignal('S2_out', 'red');
                    gameState = 'TRAIN_DEPARTED';
                    logActivity(`KA ${event.ka} telah berangkat. Segera lapor stasiun berikutnya.`);
                    updateTombol();
                });
            });
            buttons.laporKrenceng.addEventListener('click', () => {
                if (gameState !== 'TRAIN_DEPARTED') return;
                logActivity("Laporan keberangkatan berhasil dikirim ke Stasiun Krenceng.");
                gameState = 'WAITING_FOR_NEXT_TRAIN';
                currentEventIndex++;
                if (currentEventIndex < schedule.length) {
                    const nextEvent = schedule[currentEventIndex];
                    logActivity(`Menunggu kereta berikutnya (KA ${nextEvent.ka}) dari ${nextEvent.from} pukul ${nextEvent.time}.`);
                } else {
                    logActivity("Semua jadwal telah selesai. Simulasi berakhir.");
                    clearInterval(gameClockInterval);
                }
                updateTombol();
                populateScheduleBoard();
            });
        }

        // --- INISIALISASI GAME ---
        createButtons();
        attachEventListeners();
        train.style.visibility = 'visible';
        logActivity("Simulasi PPKA Stasiun Merak dimulai.");
        const firstEvent = schedule[0];
        logActivity(`KA ${firstEvent.ka} (${firstEvent.loco}) tujuan ${firstEvent.to} siap diberangkatkan dari Jalur 2.`);
        setLocoType(firstEvent.loco);
        updateStatusDashboard();
        updateTombol();
        populateScheduleBoard();
        initGameClock();
    }
});

