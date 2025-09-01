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
        const tutorialBox = document.getElementById('tutorial-box');
        const tutorialText = document.getElementById('tutorial-text');
        const nextTutorialBtn = document.getElementById('next-tutorial-btn');
        const closeTutorialBtn = document.getElementById('close-tutorial-btn');

        // --- MANAJEMEN STATUS GAME & WAKTU ---
        let gameState = 'TUTORIAL';
        let tutorialStep = 0;
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
        ];

        // --- SISTEM TUTORIAL ---
        const tutorialSteps = [
            { text: "Selamat datang, PPKA! Tugas pertama: berangkatkan KA 311. Klik tombol sinyal 'S2-Keluar' untuk memberi aspek aman (hijau).", elementId: 'btn-toggle-S2_out', isAction: true },
            { text: "Sinyal aman! Sekarang, klik tombol 'Berangkatkan' untuk mengirim KA 311.", elementId: 'btn-berangkatkan-kereta', isAction: true },
            { text: "Kereta berhasil berangkat! Lapor ke stasiun berikutnya dengan klik 'Lapor St. Berikutnya'.", elementId: 'btn-lapor-krenceng', isAction: true },
            { text: "Laporan terkirim. Kita akan menunggu KA 318 tiba pukul 07:15. Jam akan berjalan cepat. Perhatikan panel jadwal.", elementId: null, isAction: false },
            { text: "Perhatian! KA 318 akan masuk. Beri aspek aman dengan klik sinyal 'S-Masuk'.", elementId: 'btn-toggle-S_in', isAction: true },
            { text: "Rute aman. Klik 'Kereta Masuk' untuk memasukkan KA 318 ke stasiun.", elementId: 'btn-kereta-masuk', isAction: true },
            { text: "Tutorial selesai! Anda sekarang bebas mengoperasikan stasiun. Selamat bertugas, PPKA!", elementId: null, isAction: false }
        ];

        function showTutorialStep(stepIndex) {
            // Hapus highlight dari tombol sebelumnya
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

            if (stepIndex >= tutorialSteps.length) {
                tutorialBox.style.display = 'none';
                return;
            }

            const step = tutorialSteps[stepIndex];
            tutorialText.textContent = step.text;
            tutorialBox.style.display = 'block';

            // Tampilkan tombol 'Mengerti' atau sembunyikan jika ini langkah aksi
            nextTutorialBtn.style.display = step.isAction ? 'none' : 'inline-block';

            // Tambahkan highlight ke tombol yang relevan
            if (step.elementId) {
                const targetElement = document.getElementById(step.elementId);
                if (targetElement) {
                    targetElement.classList.add('tutorial-highlight');
                }
            }
        }

        function advanceTutorial() {
            tutorialStep++;
            if (tutorialStep < tutorialSteps.length) {
                showTutorialStep(tutorialStep);
                // Jika langkah berikutnya adalah menunggu, langsung nonaktifkan tombol
                if(!tutorialSteps[tutorialStep].isAction) updateTombol();
            } else {
                // Tutorial selesai
                tutorialBox.style.display = 'none';
                document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
                gameState = 'WAITING_FOR_NEXT_TRAIN'; // Lanjutkan alur game normal
                logActivity("Tutorial Selesai. Mode normal diaktifkan.");
                updateTombol();
            }
        }
        
        function endTutorial() {
            tutorialBox.style.display = 'none';
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
            gameState = 'READY_TO_DEPART'; // Reset ke state awal non-tutorial
            logActivity("Tutorial dilewati. Mode normal diaktifkan.");
            updateTombol();
        }

        nextTutorialBtn.addEventListener('click', advanceTutorial);
        closeTutorialBtn.addEventListener('click', endTutorial);

        // --- FUNGSI-FUNGSI GAME ---
        function formatTime(date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        function logActivity(message, isError = false) {
            const li = document.createElement('li');
            li.textContent = `[${formatTime(gameTime)}] ${message}`;
            if (isError) { li.classList.add('error'); }
            info.log.insertBefore(li, info.log.firstChild);
        }

        function updateStatusDashboard() {
            info.weselStatus.innerHTML = `<p><strong>Wesel 1:</strong> ${wesel1Posisi === 'J1' ? 'BELOK (ke J1)' : 'LURUS (ke J2/3)'}</p>
                                          <p><strong>Wesel 2:</strong> ${wesel2Posisi === 'J2' ? 'LURUS (ke J2)' : 'BELOK (ke J3)'}</p>
                                          <p><strong>Wesel 3:</strong> ${wesel3Posisi === 'J1_SIDING' ? 'BELOK (ke Sepur Badug)' : 'LURUS (di Jalur 2)'}</p>`;
            info.signalStatus.innerHTML = Object.values(signals).map(data => {
                const isGreen = data.light.getAttribute('fill') === '#22c55e';
                return `<p>${data.name}: <span class="status-light ${isGreen ? 'light-green' : 'light-red'}"></span></p>`;
            }).join('');
        }

        function updateTombol() {
            const isAnimating = gameState === 'ANIMATING';
            const isTutorialAction = gameState === 'TUTORIAL' && tutorialSteps[tutorialStep] && tutorialSteps[tutorialStep].isAction;

            Object.values(buttons).forEach(btn => {
                if (btn) {
                    // Nonaktifkan semua tombol jika animasi berjalan atau jika tutorial menunggu aksi
                    btn.disabled = isAnimating || isTutorialAction;
                }
            });

            if (isTutorialAction) {
                // Aktifkan hanya tombol yang disorot tutorial
                const targetId = tutorialSteps[tutorialStep].elementId;
                if (targetId && buttons[targetId.replace('btn-', '')]) {
                    document.getElementById(targetId).disabled = false;
                }
            } else if (!isAnimating && gameState !== 'TUTORIAL') {
                // Logika enable/disable normal di luar tutorial
                buttons.keretaMasuk.disabled = gameState !== 'IDLE';
                buttons.lepasLoko.disabled = gameState !== 'ARRIVED_ON_J2';
                buttons.langsirKeluar.disabled = gameState !== 'LOCO_ON_SIDING';
                buttons.kembaliKeRangkaian.disabled = gameState !== 'LOCO_SHUNTED';
                buttons.berangkatkanKereta.disabled = gameState !== 'READY_TO_DEPART';
                buttons.laporKrenceng.disabled = gameState !== 'TRAIN_DEPARTED';
            }
        }
        
        function animateElement(element, path, duration, onEnd) {
            gameState = 'ANIMATING';
            updateTombol();
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            animate.setAttribute("dur", `${duration}s`);
            animate.setAttribute("path", path.getAttribute("d"));
            animate.setAttribute("fill", "freeze");
            animate.setAttribute("rotate", "auto");
            element.appendChild(animate);
            animate.beginElement();
            setTimeout(() => {
                element.removeChild(animate);
                onEnd();
            }, duration * 1000);
        }

        function checkSignal(id) {
            return signals[id].light.getAttribute('fill') === '#22c55e';
        }

        function toggleSignal(id) {
            if(gameState === 'ANIMATING') return;
            const signalData = signals[id];
            const isRed = signalData.light.getAttribute("fill") === "#ef4444";
            signalData.light.setAttribute("fill", isRed ? "#22c55e" : "#ef4444");
            logActivity(`Sinyal ${signalData.name} diubah menjadi ${isRed ? 'AMAN (Hijau)' : 'BERHENTI (Merah)'}.`);
            updateStatusDashboard();
            
            if (gameState === 'TUTORIAL') {
                const step = tutorialSteps[tutorialStep];
                if (step.elementId === `btn-toggle-${id}`) {
                    advanceTutorial();
                    updateTombol();
                } else {
                    logActivity("Aksi tidak sesuai dengan tutorial!", true);
                }
            }
        }

        function gerakkanWesel(weselFunction) {
            if(gameState === 'ANIMATING') return;
            weselFunction();
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
        
        function updateGameClock() {
            gameTime.setSeconds(gameTime.getSeconds() + 6);
            info.gameClock.textContent = `Pukul ${formatTime(gameTime)}`;

            if (currentEventIndex < schedule.length) {
                const nextEvent = schedule[currentEventIndex];
                const [eventHour, eventMinute] = nextEvent.time.split(':');
                if (gameTime.getHours() >= parseInt(eventHour) && gameTime.getMinutes() >= parseInt(eventMinute)) {
                    if ((gameState === 'WAITING_FOR_NEXT_TRAIN' || (gameState === 'TUTORIAL' && tutorialStep === 3)) && nextEvent.type === 'ARRIVAL') {
                        setLocoType(nextEvent.loco);
                        logActivity(`PERHATIAN: KA ${nextEvent.ka} (${nextEvent.loco}) dari ${nextEvent.from} akan masuk. Siapkan rute!`);
                        if(gameState === 'TUTORIAL') {
                            advanceTutorial();
                            updateTombol();
                        } else {
                            gameState = 'IDLE';
                            updateTombol();
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
            if (currentLocoShapeRef) {
                currentLocoShapeRef.setAttribute('xlink:href', shapeId);
            }
        }

        function createButtons() {
            const controlPanel = document.getElementById("control-panel");
            controlPanel.innerHTML = `
                <div class="button-group">
                    <p>Sinyal</p>
                    <button id="btn-toggle-S_in"><i class="fa-solid fa-traffic-light"></i> S-Masuk</button>
                    <button id="btn-toggle-S1_out"><i class="fa-solid fa-arrow-up"></i> S1-Keluar</button>
                    <button id="btn-toggle-S2_out"><i class="fa-solid fa-arrow-up"></i> S2-Keluar</button>
                    <button id="btn-toggle-S3_out"><i class="fa-solid fa-arrow-up"></i> S3-Keluar</button>
                </div>
                <div class="button-group">
                    <p>Wesel</p>
                    <button id="btn-switch-wesel1"><i class="fa-solid fa-code-branch"></i> Wesel 1</button>
                    <button id="btn-switch-wesel2"><i class="fa-solid fa-code-branch"></i> Wesel 2</button>
                    <button id="btn-switch-wesel3"><i class="fa-solid fa-shuffle"></i> Wesel 3</button>
                </div>
                <div class="button-group">
                    <p>Langsir</p>
                    <button id="btn-toggle-S1_langsir"><i class="fa-solid fa-person-walking-arrow-loop-left"></i> S-Langsir 1</button>
                    <button id="btn-toggle-S2_langsir"><i class="fa-solid fa-person-walking-arrow-loop-left"></i> S-Langsir 2</button>
                    <button id="btn-lepas-loko"><i class="fa-solid fa-unlink"></i> Lepas Loko</button>
                    <button id="btn-langsir-keluar"><i class="fa-solid fa-route"></i> Langsir Keluar</button>
                    <button id="btn-kembali-ke-rangkaian"><i class="fa-solid fa-link"></i> Kembali</button>
                </div>
                <div class="button-group">
                    <p>Aksi Utama</p>
                    <button id="btn-kereta-masuk"><i class="fa-solid fa-train"></i> Kereta Masuk</button>
                    <button id="btn-berangkatkan-kereta"><i class="fa-solid fa-train-tram"></i> Berangkatkan</button>
                    <button id="btn-lapor-krenceng"><i class="fa-solid fa-phone-volume"></i> Lapor St. Berikutnya</button>
                </div>`;

             // Re-assign classes after innerHTML overwrite
            document.querySelectorAll('#control-panel button').forEach(btn => {
                const id = btn.id;
                if (id.includes('-S_') || id.includes('-sinal')) {
                    btn.classList.add('btn-signal');
                } else if (id.includes('-langsir')) {
                     btn.classList.add('btn-signal-langsir');
                } else if (id.includes('-switch-')) {
                    btn.classList.add('btn-switch');
                } else if (id.includes('-lepas-') || id.includes('-keluar') || id.includes('-kembali-')) {
                    btn.classList.add('btn-langsir');
                } else {
                    btn.classList.add('btn-action');
                }
            });

            buttons = {
                keretaMasuk: document.getElementById('btn-kereta-masuk'), lepasLoko: document.getElementById('btn-lepas-loko'),
                langsirKeluar: document.getElementById('btn-langsir-keluar'), kembaliKeRangkaian: document.getElementById('btn-kembali-ke-rangkaian'),
                berangkatkanKereta: document.getElementById('btn-berangkatkan-kereta'), wesel1: document.getElementById('btn-switch-wesel1'),
                wesel2: document.getElementById('btn-switch-wesel2'), wesel3: document.getElementById('btn-switch-wesel3'),
                laporKrenceng: document.getElementById('btn-lapor-krenceng'),
                ...Object.keys(signals).reduce((acc, id) => {
                    acc[`toggle-${id}`] = document.getElementById(`btn-toggle-${id}`); return acc;
                }, {})
            };
        }

        function attachEventListeners() {
            Object.keys(signals).forEach(id => {
                const btn = document.getElementById(`btn-toggle-${id}`);
                if (btn) btn.addEventListener("click", () => toggleSignal(id));
            });
            buttons.wesel1.addEventListener('click', () => gerakkanWesel(gerakkanWesel1));
            buttons.wesel2.addEventListener('click', () => gerakkanWesel(gerakkanWesel2));
            buttons.wesel3.addEventListener('click', () => gerakkanWesel(gerakkanWesel3));

            buttons.berangkatkanKereta.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 1;
                if (!isTutorialAction && gameState !== 'READY_TO_DEPART') { return; }
                if (!checkSignal('S2_out')) { logActivity("GAGAL: Sinyal S2 Keluar harus hijau!", true); return; }
                
                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) diberangkatkan...`);
                animateElement(train, rute.masuk_J2, 60, () => {
                    train.style.visibility = 'hidden';
                    signals.S2_out.light.setAttribute("fill", "#ef4444");
                    updateStatusDashboard();
                    gameState = 'TRAIN_DEPARTED';
                    logActivity(`KA ${event.ka} telah berangkat. Lapor ke stasiun berikutnya.`);
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                    updateTombol();
                });
            });

            buttons.laporKrenceng.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 2;
                if (!isTutorialAction && gameState !== 'TRAIN_DEPARTED') return;

                logActivity(`Laporan keberangkatan berhasil dikirim.`);
                gameState = 'WAITING_FOR_NEXT_TRAIN';
                currentEventIndex++;
                populateScheduleBoard();
                if (isTutorialAction) {
                    advanceTutorial();
                }
                updateTombol();

                if (currentEventIndex >= schedule.length) {
                    logActivity("Semua jadwal telah selesai.");
                    clearInterval(gameClockInterval);
                }
            });

            buttons.keretaMasuk.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 5;
                if (!isTutorialAction && gameState !== 'IDLE') return;
                if (!checkSignal('S_in')) { logActivity("GAGAL: Sinyal Masuk harus hijau!", true); return; }

                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) mulai masuk...`);
                train.style.visibility = "visible";
                animateElement(train, rute.masuk_J2, 60, () => {
                    signals.S_in.light.setAttribute("fill", "#ef4444");
                    updateStatusDashboard();
                    gameState = 'ARRIVED_ON_J2';
                    logActivity(`KA ${event.ka} telah tiba di Jalur 2.`);
                    currentEventIndex++;
                    populateScheduleBoard();
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                     updateTombol();
                });
            });
        }

        // --- INISIALISASI GAME ---
        createButtons();
        attachEventListeners();
        const firstEvent = schedule[0];
        train.style.visibility = 'visible';
        setLocoType(firstEvent.loco);
        initGameClock();
        populateScheduleBoard();
        updateStatusDashboard();
        showTutorialStep(tutorialStep);
        updateTombol();
        logActivity("Simulasi PPKA Stasiun Merak dimulai.");
    }
});

