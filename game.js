document.addEventListener("DOMContentLoaded", function() {
    const stasiunObject = document.getElementById("stasiun");

    const onSvgLoaded = () => {
        console.log("[DEBUG] SVG load event triggered");
        const svgDoc = stasiunObject.contentDocument;
        if (!svgDoc) {
            console.error("Gagal memuat konten SVG.");
            alert("Error: SVG tidak dapat dimuat. Pastikan file merak.xml ada di folder assets/");
            return;
        }
        console.log("[DEBUG] SVG document loaded successfully");
        initializeGame(svgDoc);
    };

    // Tambahkan multiple fallback untuk loading SVG
    if (stasiunObject.contentDocument && stasiunObject.contentDocument.readyState === 'complete') {
        console.log("[DEBUG] SVG already loaded");
        onSvgLoaded();
    } else {
        console.log("[DEBUG] Waiting for SVG to load...");
        stasiunObject.addEventListener("load", onSvgLoaded);
        
        // Fallback jika SVG tidak load dalam 5 detik
        setTimeout(() => {
            if (!stasiunObject.contentDocument) {
                console.error("[ERROR] SVG failed to load within 5 seconds");
                alert("Error: SVG gagal dimuat. Cek file merak.xml di folder assets/");
            }
        }, 5000);
    }

    function initializeGame(svgDoc) {
        console.log("[DEBUG] Initializing game with SVG document");
        
        // --- DISCOVER SVG ELEMENTS DYNAMICALLY ---
        function findElementsInSVG() {
            const allElements = svgDoc.querySelectorAll('*[id]');
            console.log("[DEBUG] Available SVG elements with IDs:");
            allElements.forEach(el => {
                console.log(`  - ${el.id} (${el.tagName})`);
            });
            
            return {
                signals: findSignalElements(svgDoc),
                wesels: findWeselElements(svgDoc),
                trains: findTrainElements(svgDoc),
                routes: findRouteElements(svgDoc)
            };
        }
        
        function findSignalElements(svgDoc) {
            const signalIds = ['S_in', 'S1_out', 'S2_out', 'S3_out', 'S1_langsir', 'S2_langsir'];
            const signals = {};
            
            signalIds.forEach(id => {
                let element = svgDoc.getElementById(id);
                
                if (element) {
                    signals[id] = { 
                        light: element, 
                        name: getSignalDisplayName(id)
                    };
                    console.log(`[DEBUG] Signal ${id} found and registered`);
                } else {
                    console.warn(`[WARN] Signal ${id} not found in SVG`);
                    signals[id] = { 
                        light: createDummyElement(), 
                        name: getSignalDisplayName(id)
                    };
                }
            });
            
            return signals;
        }
        
        function findWeselElements(svgDoc) {
            const weselIds = ['W1_to_J1', 'W1_to_J2J3', 'W2_to_J2', 'W2_to_J3', 'W3_to_J2_straight', 'W3_to_J1_siding'];
            const wesels = {};
            
            weselIds.forEach(id => {
                let element = svgDoc.getElementById(id);
                
                if (element) {
                    wesels[id] = element;
                    console.log(`[DEBUG] Wesel ${id} found and registered`);
                } else {
                    console.warn(`[WARN] Wesel ${id} not found in SVG`);
                    wesels[id] = createDummyElement();
                }
            });
            
            return wesels;
        }
        
        function findTrainElements(svgDoc) {
            const trains = {};
            
            trains.train = svgDoc.getElementById('train');
            if (trains.train) {
                console.log(`[DEBUG] Train element found`);
            } else {
                console.warn(`[WARN] Train element not found`);
                trains.train = createDummyElement();
            }
            
            trains.locomotive = svgDoc.getElementById('locomotive');
            if (trains.locomotive) {
                console.log(`[DEBUG] Locomotive element found`);
            } else {
                console.warn(`[WARN] Locomotive element not found`);
                trains.locomotive = createDummyElement();
            }
            
            trains['current-loco-shape'] = svgDoc.getElementById('current-loco-shape');
            if (trains['current-loco-shape']) {
                console.log(`[DEBUG] Current-loco-shape found`);
            } else {
                console.warn(`[WARN] Current-loco-shape not found`);
                trains['current-loco-shape'] = createDummyElement();
            }
            
            return trains;
        }
        
        function findRouteElements(svgDoc) {
            const routeIds = ['route_masuk_J2', 'route_J2_to_siding', 'route_siding_to_krenceng', 'route_krenceng_to_J2_head'];
            const routes = {};
            
            routeIds.forEach(id => {
                let element = svgDoc.getElementById(id);
                
                if (element) {
                    routes[id] = element;
                    console.log(`[DEBUG] Route ${id} found and registered`);
                } else {
                    console.warn(`[WARN] Route ${id} not found in SVG`);
                    routes[id] = createDummyPath();
                }
            });
            
            return routes;
        }
        
        function getSignalDisplayName(id) {
            const names = {
                'S_in': 'Sinyal Masuk',
                'S1_out': 'S1 Keluar', 
                'S2_out': 'S2 Keluar',
                'S3_out': 'S3 Keluar',
                'S1_langsir': 'Langsir 1',
                'S2_langsir': 'Langsir 2'
            };
            return names[id] || id;
        }
        
        function createDummyElement() {
            const dummy = svgDoc.createElement('g');
            dummy.setAttribute = function(attr, value) {
                console.log(`[DEBUG] Dummy element setAttribute: ${attr} = ${value}`);
            };
            dummy.getAttribute = function(attr) {
                console.log(`[DEBUG] Dummy element getAttribute: ${attr}`);
                return attr === 'fill' ? '#ef4444' : '';
            };
            dummy.style = { visibility: 'hidden' };
            dummy.classList = { toggle: () => console.log("[DEBUG] Dummy classList toggle") };
            return dummy;
        }
        
        function createDummyPath() {
            const dummy = svgDoc.createElement('path');
            dummy.getAttribute = function(attr) {
                if (attr === 'd') return 'M 0 0 L 100 100';
                return '';
            };
            return dummy;
        }

        // --- KUMPULKAN SEMUA ELEMEN PENTING ---
        const svgElements = findElementsInSVG();
        const signals = svgElements.signals;
        const wesels = svgElements.wesels;
        const train = svgElements.trains.train;
        const locomotive = svgElements.trains.locomotive;
        const currentLocoShapeRef = svgElements.trains['current-loco-shape'];
        const rute = {
            masuk_J2: svgElements.routes['route_masuk_J2'],
            J2_to_siding: svgElements.routes['route_J2_to_siding'],
            siding_to_krenceng: svgElements.routes['route_siding_to_krenceng'],
            krenceng_to_J2_head: svgElements.routes['route_krenceng_to_J2_head']
        };

        const info = {
            weselStatus: document.getElementById('wesel-status-display'),
            signalStatus: document.getElementById('signal-status-display'),
            log: document.getElementById('activity-log'),
            gameClock: document.getElementById('game-clock-display'),
            scheduleDisplay: document.getElementById('schedule-display')
        };
        const tutorialBox = document.getElementById('tutorial-box');
        const tutorialText = document.getElementById('tutorial-text');
        const nextTutorialBtn = document.getElementById('next-tutorial-btn');
        const closeTutorialBtn = document.getElementById('close-tutorial-btn');

        // --- GAME STATE BERDASARKAN BLUEPRINT ---
        let gameState = 'TUTORIAL';
        let tutorialStep = 0;
        let wesel1Posisi = 'J2&J3'; // Default: ke jalur 1/2
        let wesel2Posisi = 'J2';    // Default: ke jalur 2
        let wesel3Posisi = 'J2_STRAIGHT'; // Default: lurus J2
        let buttons = {};
        let gameTime = new Date();
        let gameClockInterval;
        let currentEventIndex = 0;
        let isWaitingForEvent = false;
        
        const schedule = [
            { type: 'ARRIVAL', ka: '318', loco: 'CC203', time: '07:15', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '319', loco: 'CC203', time: '09:00', from: 'Merak', to: 'Rangkasbitung'},
            { type: 'ARRIVAL', ka: '312', loco: 'CC206', time: '11:15', from: 'Rangkasbitung', to: 'Merak' },
            { type: 'DEPARTURE', ka: '313', loco: 'CC206', time: '12:45', from: 'Merak', to: 'Rangkasbitung'},
        ];

        // --- TUTORIAL BERDASARKAN BLUEPRINT ---
        const tutorialSteps = [
            { 
                text: "Selamat datang, PPKA! KA 318 akan tiba dari Rangkasbitung. Pertama, pastikan Wesel 1 diarahkan ke 'Jalur 1/2'.", 
                elementId: 'btn-switch-wesel1', 
                isAction: true,
                requiredWeselState: { wesel: 1, position: 'J2&J3' }
            },
            { 
                text: "Baik! Sekarang atur Wesel 2 agar mengarah ke 'Jalur 2'.", 
                elementId: 'btn-switch-wesel2', 
                isAction: true,
                requiredWeselState: { wesel: 2, position: 'J2' }
            },
            { 
                text: "Rute sudah benar! Beri aspek aman dengan klik Sinyal Masuk agar kereta bisa masuk.", 
                elementId: 'btn-toggle-S_in', 
                isAction: true
            },
            { 
                text: "Sinyal aman! Sekarang terima kereta dengan klik 'Kereta Masuk'.", 
                elementId: 'btn-kereta-masuk', 
                isAction: true
            },
            { 
                text: "Kereta telah tiba di Jalur 2! Sekarang kita akan tukar haluan. Atur Wesel 3 agar menghubungkan Jalur 1 dan 2.", 
                elementId: 'btn-switch-wesel3', 
                isAction: true,
                requiredWeselState: { wesel: 3, position: 'J1_SIDING' }
            },
            { 
                text: "Wesel siap! Klik 'Lepas & Tukar Haluan' untuk memindahkan lokomotif.", 
                elementId: 'btn-lepas-tukar-haluan', 
                isAction: true
            },
            { 
                text: "Lokomotif sudah di posisi! Klik 'Sambung Loko' untuk menyambung kembali.", 
                elementId: 'btn-sambung-loko', 
                isAction: true
            },
            { 
                text: "Kereta siap berangkat! Atur Wesel 2 ke 'Jalur 1' untuk rute keluar.", 
                elementId: 'btn-switch-wesel2', 
                isAction: true,
                requiredWeselState: { wesel: 2, position: 'J3' }
            },
            { 
                text: "Beri aspek aman pada Sinyal S1-Keluar.", 
                elementId: 'btn-toggle-S1_out', 
                isAction: true
            },
            { 
                text: "Berangkatkan kereta dengan klik 'Berangkatkan'!", 
                elementId: 'btn-berangkatkan-kereta', 
                isAction: true
            },
            { 
                text: "Kereta berhasil berangkat! Lapor ke stasiun berikutnya.", 
                elementId: 'btn-lapor-krenceng', 
                isAction: true
            },
            { 
                text: "Tutorial selesai! Anda telah menguasai operasi run-around. Selamat bertugas, PPKA!", 
                elementId: null, 
                isAction: false
            }
        ];

        function showTutorialStep(stepIndex) {
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

            if (stepIndex >= tutorialSteps.length) {
                endTutorial();
                return;
            }

            const step = tutorialSteps[stepIndex];
            tutorialText.textContent = step.text;
            tutorialBox.style.display = 'block';

            nextTutorialBtn.style.display = step.isAction ? 'none' : 'inline-block';

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
                updateTombol();
            } else {
                endTutorial();
            }
        }
        
        function endTutorial() {
            tutorialBox.style.display = 'none';
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
            gameState = 'MENUNGGU_KEDATANGAN';
            logActivity("Tutorial selesai. Mode normal diaktifkan.");
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
            console.log(`[DEBUG] logActivity called: ${message}`);
            
            if (!info.log) {
                console.error("Element activity-log tidak ditemukan!");
                return;
            }
            
            const li = document.createElement('li');
            li.textContent = `[${formatTime(gameTime)}] ${message}`;
            if (isError) { li.classList.add('error'); }
            info.log.insertBefore(li, info.log.firstChild);
            
            console.log(`[DEBUG] Log berhasil ditambahkan: ${li.textContent}`);
        }

        function updateStatusDashboard() {
            if (!info.weselStatus || !info.signalStatus) return;
            
            info.weselStatus.innerHTML = `
                <p><strong>Wesel 1:</strong> ${wesel1Posisi === 'J1' ? 'BELOK (ke J1)' : 'LURUS (ke J1/2)'}</p>
                <p><strong>Wesel 2:</strong> ${wesel2Posisi === 'J2' ? 'LURUS (ke J2)' : 'BELOK (ke J1/3)'}</p>
                <p><strong>Wesel 3:</strong> ${wesel3Posisi === 'J1_SIDING' ? 'BELOK (ke Jalur 1)' : 'LURUS (Jalur 2)'}</p>`;
            
            info.signalStatus.innerHTML = Object.values(signals).map(data => {
                const isGreen = data.light.getAttribute('fill') === '#22c55e';
                return `<p>${data.name}: <span class="status-light ${isGreen ? 'light-green' : 'light-red'}"></span></p>`;
            }).join('');
        }

        // --- STATE MANAGEMENT BERDASARKAN BLUEPRINT ---
        function updateTombol() {
            const isAnimating = gameState === 'ANIMATING';
            const isTutorial = gameState === 'TUTORIAL';
            
            // Nonaktifkan semua tombol saat animasi
            if (isAnimating) {
                Object.values(buttons).forEach(btn => {
                    if (btn) btn.disabled = true;
                });
                return;
            }

            // Logika tutorial
            if (isTutorial) {
                Object.values(buttons).forEach(btn => {
                    if (btn) btn.disabled = true;
                });

                if (tutorialSteps[tutorialStep] && tutorialSteps[tutorialStep].isAction) {
                    const targetId = tutorialSteps[tutorialStep].elementId;
                    if (targetId) {
                        const targetBtn = document.getElementById(targetId);
                        if (targetBtn) targetBtn.disabled = false;
                    }
                }
                return;
            }

            // Reset semua tombol ke aktif
            Object.values(buttons).forEach(btn => {
                if (btn) btn.disabled = false;
            });

            // Disable tombol berdasarkan state game
            switch(gameState) {
                case 'MENUNGGU_KEDATANGAN':
                    buttons.keretaMasuk.disabled = true;
                    buttons.lepasTukarHaluan.disabled = true;
                    buttons.sambungLoko.disabled = true;
                    buttons.berangkatkanKereta.disabled = true;
                    buttons.laporKrenceng.disabled = true;
                    break;
                    
                case 'SIAPKAN_RUTE_MASUK':
                    buttons.lepasTukarHaluan.disabled = true;
                    buttons.sambungLoko.disabled = true;
                    buttons.berangkatkanKereta.disabled = true;
                    buttons.laporKrenceng.disabled = true;
                    break;
                    
                case 'TIBA_DI_JALUR_2':
                    buttons.keretaMasuk.disabled = true;
                    buttons.sambungLoko.disabled = true;
                    buttons.berangkatkanKereta.disabled = true;
                    buttons.laporKrenceng.disabled = true;
                    break;
                    
                case 'LOKO_DI_JALUR_1':
                    buttons.keretaMasuk.disabled = true;
                    buttons.lepasTukarHaluan.disabled = true;
                    buttons.berangkatkanKereta.disabled = true;
                    buttons.laporKrenceng.disabled = true;
                    break;
                    
                case 'SIAP_BERANGKAT':
                    buttons.keretaMasuk.disabled = true;
                    buttons.lepasTukarHaluan.disabled = true;
                    buttons.sambungLoko.disabled = true;
                    buttons.laporKrenceng.disabled = true;
                    break;
                    
                case 'TELAH_BERANGKAT':
                    buttons.keretaMasuk.disabled = true;
                    buttons.lepasTukarHaluan.disabled = true;
                    buttons.sambungLoko.disabled = true;
                    buttons.berangkatkanKereta.disabled = true;
                    break;
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

        function checkWeselRoute() {
            // Validasi rute berdasarkan blueprint
            const routeErrors = [];
            
            if (gameState === 'SIAPKAN_RUTE_MASUK') {
                if (wesel1Posisi !== 'J2&J3') {
                    routeErrors.push("Wesel 1 harus diarahkan ke Jalur 1/2");
                }
                if (wesel2Posisi !== 'J2') {
                    routeErrors.push("Wesel 2 harus diarahkan ke Jalur 2");
                }
            }
            
            if (gameState === 'SIAP_BERANGKAT') {
                if (wesel2Posisi !== 'J3') {
                    routeErrors.push("Wesel 2 harus diarahkan ke Jalur 1 untuk keluar");
                }
                if (wesel1Posisi !== 'J2&J3') {
                    routeErrors.push("Wesel 1 harus diarahkan ke Jalur 1/2 untuk keluar");
                }
            }
            
            return routeErrors;
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
                } else {
                    logActivity("Aksi tidak sesuai dengan tutorial!", true);
                }
            }
        }

        function gerakkanWesel(weselFunction, weselNum) {
            if(gameState === 'ANIMATING') return;
            
            weselFunction();
            
            if (gameState === 'TUTORIAL') {
                const step = tutorialSteps[tutorialStep];
                if (step.requiredWeselState && step.requiredWeselState.wesel === weselNum) {
                    const currentPos = weselNum === 1 ? wesel1Posisi : 
                                     weselNum === 2 ? wesel2Posisi : wesel3Posisi;
                    if (currentPos === step.requiredWeselState.position) {
                        advanceTutorial();
                    }
                }
            }
        }

        function gerakkanWesel1() {
            wesel1Posisi = (wesel1Posisi === 'J1') ? 'J2&J3' : 'J1';
            wesels.W1_to_J1.classList.toggle('hidden');
            wesels.W1_to_J2J3.classList.toggle('hidden');
            logActivity(`Wesel 1 diubah ke arah ${wesel1Posisi === 'J1' ? 'Jalur 1' : 'Jalur 1/2'}.`);
            updateStatusDashboard();
        }

        function gerakkanWesel2() {
            wesel2Posisi = (wesel2Posisi === 'J2') ? 'J3' : 'J2';
            wesels.W2_to_J3.classList.toggle('hidden');
            wesels.W2_to_J2.classList.toggle('hidden');
            logActivity(`Wesel 2 diubah ke arah ${wesel2Posisi === 'J2' ? 'Jalur 2' : 'Jalur 1/3'}.`);
            updateStatusDashboard();
        }
        
        function gerakkanWesel3() {
            wesel3Posisi = (wesel3Posisi === 'J2_STRAIGHT') ? 'J1_SIDING' : 'J2_STRAIGHT';
            wesels.W3_to_J2_straight.classList.toggle('hidden');
            wesels.W3_to_J1_siding.classList.toggle('hidden');
            logActivity(`Wesel 3 diubah ke arah ${wesel3Posisi === 'J1_SIDING' ? 'Jalur 1 (Tukar Haluan)' : 'Lurus Jalur 2'}.`);
            updateStatusDashboard();
        }
        
        function updateGameClock() {
            gameTime.setSeconds(gameTime.getSeconds() + 10); // Dipercepat lebih cepat
            const timeString = `Pukul ${formatTime(gameTime)}`;
            info.gameClock.textContent = timeString;

            // Cek event berikutnya
            if (currentEventIndex < schedule.length && !isWaitingForEvent) {
                const nextEvent = schedule[currentEventIndex];
                const [eventHour, eventMinute] = nextEvent.time.split(':');
                const eventTime = eventHour * 60 + parseInt(eventMinute);
                const currentTime = gameTime.getHours() * 60 + gameTime.getMinutes();
                
                if (currentTime >= eventTime) {
                    isWaitingForEvent = true;
                    console.log(`[DEBUG] Event triggered: ${nextEvent.type} - ${nextEvent.ka}`);
                    
                    if (nextEvent.type === 'ARRIVAL') {
                        if (gameState === 'MENUNGGU_KEDATANGAN' || gameState === 'TUTORIAL') {
                            setLocoType(nextEvent.loco);
                            logActivity(`PERHATIAN: KA ${nextEvent.ka} (${nextEvent.loco}) dari ${nextEvent.from} akan masuk!`);
                            gameState = 'SIAPKAN_RUTE_MASUK';
                            updateTombol();
                        }
                    } else if (nextEvent.type === 'DEPARTURE') {
                        if (gameState === 'SIAP_BERANGKAT') {
                            logActivity(`PERHATIAN: Waktu keberangkatan KA ${nextEvent.ka}!`);
                            updateTombol();
                        }
                    }
                }
            }
        }

        function initGameClock() {
            console.log(`[DEBUG] Initializing game clock...`);
            
            // Mulai 30 menit sebelum kedatangan pertama untuk tutorial
            const [startHour, startMinute] = schedule[0].time.split(':');
            gameTime.setHours(parseInt(startHour), parseInt(startMinute) - 30, 0, 0);
            
            const initialTime = `Pukul ${formatTime(gameTime)}`;
            info.gameClock.textContent = initialTime;
            console.log(`[DEBUG] Initial time set: ${initialTime}`);
            
            if (!info.gameClock) {
                console.error("Element game-clock-display tidak ditemukan!");
                return;
            }
            
            gameClockInterval = setInterval(updateGameClock, 800); // 800ms untuk waktu yang lebih smooth
            console.log(`[DEBUG] Clock interval started`);
        }

        function populateScheduleBoard() {
            console.log(`[DEBUG] Populating schedule board, currentEventIndex: ${currentEventIndex}`);
            
            if (!info.scheduleDisplay) {
                console.error("Element schedule-display tidak ditemukan!");
                return;
            }
            
            let html = '<table><thead><tr><th>Waktu</th><th>KA</th><th>Loko</th><th>Dari/Ke</th><th style="text-align:center;">Jenis</th></tr></thead><tbody>';
            schedule.forEach((event, index) => {
                const className = (index === currentEventIndex) ? 'class="active-train"' : '';
                const destination = event.type === 'ARRIVAL' ? event.from : event.to;
                const typeLabel = event.type === 'ARRIVAL' ? 'DATANG' : 'BERANGKAT';
                html += `<tr ${className}><td>${event.time}</td><td>${event.ka}</td><td>${event.loco}</td><td>${destination}</td><td style="text-align:center;">${typeLabel}</td></tr>`;
            });
            html += '</tbody></table>';
            info.scheduleDisplay.innerHTML = html;
            console.log(`[DEBUG] Schedule board populated with ${schedule.length} events`);
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
                console.log(`[DEBUG] Locomotive type set to: ${type}`);
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
                    <p>Run-Around</p>
                    <button id="btn-lepas-tukar-haluan"><i class="fa-solid fa-arrows-rotate"></i> Lepas & Tukar Haluan</button>
                    <button id="btn-sambung-loko"><i class="fa-solid fa-link"></i> Sambung Loko</button>
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
                if (id.includes('toggle-S_') || id.includes('toggle-S1_') || id.includes('toggle-S2_') || id.includes('toggle-S3_')) {
                    btn.classList.add('btn-signal');
                } else if (id.includes('switch-wesel')) {
                    btn.classList.add('btn-switch');
                } else if (id.includes('lepas-') || id.includes('sambung-')) {
                    btn.classList.add('btn-langsir');
                } else {
                    btn.classList.add('btn-action');
                }
            });

            buttons = {
                keretaMasuk: document.getElementById('btn-kereta-masuk'),
                lepasTukarHaluan: document.getElementById('btn-lepas-tukar-haluan'),
                sambungLoko: document.getElementById('btn-sambung-loko'),
                berangkatkanKereta: document.getElementById('btn-berangkatkan-kereta'),
                wesel1: document.getElementById('btn-switch-wesel1'),
                wesel2: document.getElementById('btn-switch-wesel2'),
                wesel3: document.getElementById('btn-switch-wesel3'),
                laporKrenceng: document.getElementById('btn-lapor-krenceng'),
                ...Object.keys(signals).reduce((acc, id) => {
                    acc[`toggle-${id}`] = document.getElementById(`btn-toggle-${id}`);
                    return acc;
                }, {})
            };
        }

        function attachEventListeners() {
            // Event listeners untuk sinyal
            Object.keys(signals).forEach(id => {
                const btn = document.getElementById(`btn-toggle-${id}`);
                if (btn) btn.addEventListener("click", () => toggleSignal(id));
            });

            // Event listeners untuk wesel
            buttons.wesel1.addEventListener('click', () => gerakkanWesel(gerakkanWesel1, 1));
            buttons.wesel2.addEventListener('click', () => gerakkanWesel(gerakkanWesel2, 2));
            buttons.wesel3.addEventListener('click', () => gerakkanWesel(gerakkanWesel3, 3));

            // === FASE 1: KEDATANGAN KERETA ===
            buttons.keretaMasuk.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 3;
                if (!isTutorialAction && gameState !== 'SIAPKAN_RUTE_MASUK') return;
                
                // Validasi rute dan sinyal
                const routeErrors = checkWeselRoute();
                if (routeErrors.length > 0) {
                    routeErrors.forEach(error => logActivity(`GAGAL: ${error}`, true));
                    return;
                }
                
                if (!checkSignal('S_in')) {
                    logActivity("GAGAL: Sinyal Masuk harus hijau!", true);
                    return;
                }

                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) mulai masuk ke Jalur 2...`);
                train.style.visibility = "visible";
                
                animateElement(train, rute.masuk_J2, 4, () => {
                    signals.S_in.light.setAttribute("fill", "#ef4444");
                    updateStatusDashboard();
                    gameState = 'TIBA_DI_JALUR_2';
                    logActivity(`KA ${event.ka} telah tiba di Jalur 2. Siap untuk tukar haluan.`);
                    
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                    updateTombol();
                });
            });

            // === FASE 2: RUN-AROUND (TUKAR HALUAN) ===
            buttons.lepasTukarHaluan.addEventListener('click', () => {
                if(gameState === 'ANIMATING' || gameState !== 'TIBA_DI_JALUR_2') return;
                
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 5;
                
                if (wesel3Posisi !== 'J1_SIDING') {
                    logActivity("GAGAL: Wesel 3 harus menghubungkan Jalur 1 dan 2!", true);
                    return;
                }

                logActivity("Memulai proses tukar haluan lokomotif...");
                
                // Sembunyikan rangkaian, tampilkan lokomotif
                train.style.visibility = "hidden";
                locomotive.style.visibility = "visible";
                
                animateElement(locomotive, rute.J2_to_siding, 3, () => {
                    gameState = 'LOKO_DI_JALUR_1';
                    logActivity("Lokomotif berhasil dipindah ke Jalur 1. Siap disambung kembali.");
                    
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                    updateTombol();
                });
            });

            // === FASE 3: PENYAMBUNGAN KEMBALI ===
            buttons.sambungLoko.addEventListener('click', () => {
                if(gameState === 'ANIMATING' || gameState !== 'LOKO_DI_JALUR_1') return;
                
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 6;
                
                if (wesel3Posisi !== 'J1_SIDING') {
                    logActivity("GAGAL: Wesel 3 harus tetap menghubungkan Jalur 1 dan 2!", true);
                    return;
                }

                logActivity("Menyambung lokomotif ke posisi baru...");
                
                animateElement(locomotive, rute.krenceng_to_J2_head, 3, () => {
                    locomotive.style.visibility = "hidden";
                    train.style.visibility = "visible";
                    
                    gameState = 'SIAP_BERANGKAT';
                    logActivity("Tukar haluan selesai! Kereta siap berangkat dengan posisi loko baru.");
                    
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                    updateTombol();
                });
            });

            // === FASE 4: KEBERANGKATAN ===
            buttons.berangkatkanKereta.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 9;
                if (!isTutorialAction && gameState !== 'SIAP_BERANGKAT') return;
                
                // Validasi rute keluar
                const routeErrors = checkWeselRoute();
                if (routeErrors.length > 0) {
                    routeErrors.forEach(error => logActivity(`GAGAL: ${error}`, true));
                    return;
                }
                
                if (!checkSignal('S1_out')) {
                    logActivity("GAGAL: Sinyal S1 Keluar harus hijau!", true);
                    return;
                }
                
                const event = schedule[currentEventIndex];
                logActivity(`KA ${event.ka} (${event.loco}) diberangkatkan menuju ${event.to}...`);
                
                animateElement(train, rute.siding_to_krenceng, 4, () => {
                    train.style.visibility = 'hidden';
                    signals.S1_out.light.setAttribute("fill", "#ef4444");
                    updateStatusDashboard();
                    gameState = 'TELAH_BERANGKAT';
                    logActivity(`KA ${event.ka} telah berangkat menuju ${event.to}.`);
                    
                    if (isTutorialAction) {
                        advanceTutorial();
                    }
                    updateTombol();
                });
            });

            // === FASE 5: LAPOR DAN SIKLUS BARU ===
            buttons.laporKrenceng.addEventListener('click', () => {
                if(gameState === 'ANIMATING') return;
                
                const isTutorialAction = gameState === 'TUTORIAL' && tutorialStep === 10;
                if (!isTutorialAction && gameState !== 'TELAH_BERANGKAT') return;

                logActivity(`Laporan keberangkatan terkirim ke stasiun berikutnya.`);
                isWaitingForEvent = false;
                currentEventIndex++;
                populateScheduleBoard();
                
                if (isTutorialAction) {
                    advanceTutorial();
                } else {
                    gameState = 'MENUNGGU_KEDATANGAN';
                }
                updateTombol();

                if (currentEventIndex >= schedule.length) {
                    logActivity("Semua jadwal telah selesai. Operasi stasiun berakhir.");
                    gameState = 'GAME_COMPLETE';
                    clearInterval(gameClockInterval);
                    updateTombol();
                }
            });
        }

        // --- FUNGSI BANTUAN ---
        function showHint() {
            let hint = "";
            switch(gameState) {
                case 'MENUNGGU_KEDATANGAN':
                    hint = "Tunggu pengumuman kedatangan kereta sesuai jadwal";
                    break;
                case 'SIAPKAN_RUTE_MASUK':
                    hint = "Atur Wesel 1 (ke Jalur 1/2) dan Wesel 2 (ke Jalur 2), lalu beri sinyal masuk hijau";
                    break;
                case 'TIBA_DI_JALUR_2':
                    hint = "Atur Wesel 3 untuk menghubungkan Jalur 1-2, lalu lepas dan tukar haluan";
                    break;
                case 'LOKO_DI_JALUR_1':
                    hint = "Sambung lokomotif kembali ke rangkaian";
                    break;
                case 'SIAP_BERANGKAT':
                    hint = "Atur Wesel 2 ke Jalur 1, beri sinyal S1-Keluar hijau, lalu berangkatkan";
                    break;
                case 'TELAH_BERANGKAT':
                    hint = "Lapor ke stasiun berikutnya untuk menyelesaikan siklus";
                    break;
            }
            if (hint) {
                logActivity(`BANTUAN: ${hint}`);
            }
        }

        function addHelpButton() {
            const controlPanel = document.getElementById("control-panel");
            const helpGroup = document.createElement('div');
            helpGroup.className = 'button-group';
            helpGroup.innerHTML = `
                <p>Bantuan</p>
                <button id="btn-help" class="btn-action"><i class="fa-solid fa-question-circle"></i> Petunjuk</button>
            `;
            controlPanel.appendChild(helpGroup);
            
            document.getElementById('btn-help').addEventListener('click', showHint);
        }

        // --- INISIALISASI GAME STATE ---
        function initializeGameState() {
            console.log(`[DEBUG] Initializing game state...`);
            
            // Set state awal: menunggu kedatangan pertama
            gameState = 'TUTORIAL';
            
            // Sembunyikan semua kereta di awal
            if (train) {
                train.style.visibility = 'hidden';
                console.log(`[DEBUG] Train hidden initially`);
            }
            if (locomotive) {
                locomotive.style.visibility = 'hidden';
                console.log(`[DEBUG] Locomotive hidden initially`);
            }
            
            // Set semua sinyal ke merah
            Object.keys(signals).forEach(id => {
                if (signals[id].light) {
                    signals[id].light.setAttribute("fill", "#ef4444");
                    console.log(`[DEBUG] Signal ${id} set to red`);
                } else {
                    console.warn(`[WARN] Signal ${id} not found in SVG`);
                }
            });
            
            // Set wesel ke posisi default untuk tutorial
            updateStatusDashboard();
            console.log(`[DEBUG] Game state initialized to: ${gameState}`);
        }

        // --- INISIALISASI LENGKAP ---
        console.log(`[DEBUG] Starting game initialization...`);
        
        // Cek apakah semua elemen HTML ada
        const requiredElements = ['game-clock-display', 'activity-log', 'schedule-display', 'wesel-status-display', 'signal-status-display'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error(`[ERROR] Missing HTML elements: ${missingElements.join(', ')}`);
            alert(`Error: Elemen HTML tidak ditemukan: ${missingElements.join(', ')}`);
            return;
        }
        
        console.log(`[DEBUG] All required HTML elements found`);
        
        createButtons();
        addHelpButton();
        attachEventListeners();
        initializeGameState();
        initGameClock();
        populateScheduleBoard();
        updateStatusDashboard();
        showTutorialStep(tutorialStep);
        updateTombol();
        logActivity("Simulasi PPKA Stasiun Merak dimulai. Menunggu kedatangan KA 318...");
        
        console.log(`[DEBUG] Game initialization complete. Current state: ${gameState}`);
        
        // --- ERROR HANDLING ---
        window.addEventListener('error', function(e) {
            console.error('Game Error:', e.error);
            logActivity(`ERROR: ${e.message}`, true);
        });
    }
});