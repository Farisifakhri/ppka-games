document.addEventListener("DOMContentLoaded", function() {
    const stasiunObject = document.getElementById("stasiun");
    const controlPanel = document.getElementById("control-panel");

    stasiunObject.addEventListener("load", function() {
        const svgDoc = stasiunObject.contentDocument;
        if (!svgDoc) {
            console.error("Gagal memuat konten SVG.");
            return;
        }

        // KUMPULKAN SEMUA ELEMEN PENTING
        const signals = {
            S_in: { light: svgDoc.getElementById("S_in"), name: "Sinyal Masuk" },
            S1_out: { light: svgDoc.getElementById("S1_out"), name: "S1 Keluar" },
            S2_out: { light: svgDoc.getElementById("S2_out"), name: "S2 Keluar" },
            S3_out: { light: svgDoc.getElementById("S3_out"), name: "S3 Keluar" },
            S1_badug: { light: svgDoc.getElementById("S1_badug"), name: "Langsir 1" },
            S2_badug: { light: svgDoc.getElementById("S2_badug"), name: "Langsir 2" }
        };
        const wesels = {
            W1_to_J1: svgDoc.getElementById("W1_to_J1"), W1_to_J2J3: svgDoc.getElementById("W1_to_J2J3"),
            W2_to_J2: svgDoc.getElementById("W2_to_J2"), W2_to_J3: svgDoc.getElementById("W2_to_J3")
        };
        const train = svgDoc.getElementById("train");
        const locomotive = svgDoc.getElementById("locomotive");
        const carriages = svgDoc.getElementById("carriages");
        const rute = {
            masuk_J2: svgDoc.getElementById('route_masuk_J2'), J2_to_badug: svgDoc.getElementById('route_J2_to_badug'),
            badug_to_krenceng_via_J1: svgDoc.getElementById('route_badug_to_krenceng_via_J1'),
            krenceng_to_J2: svgDoc.getElementById('route_krenceng_to_J2')
        };
        const info = {
            weselStatus: document.getElementById('wesel-status-display'),
            signalStatus: document.getElementById('signal-status-display'),
            log: document.getElementById('activity-log')
        };

        // MANAJEMEN STATUS GAME
        let gameState = 'IDLE';
        let wesel1Posisi = 'J2&J3';
        let wesel2Posisi = 'J2';
        let buttons = {};

        // FUNGSI-FUNGSI UTAMA
        function logActivity(message, isError = false) {
            const li = document.createElement('li');
            li.textContent = message;
            if (isError) {
                li.style.color = '#be123c';
                li.style.fontWeight = 'bold';
            }
            info.log.insertBefore(li, info.log.firstChild);
        }

        function updateStatusDashboard() {
            info.weselStatus.innerHTML = `<p><strong>Wesel 1:</strong> ${wesel1Posisi === 'J1' ? 'BELOK (ke J1)' : 'LURUS (ke J2/3)'}</p>
                                          <p><strong>Wesel 2:</strong> ${wesel2Posisi === 'J2' ? 'LURUS (ke J2)' : 'BELOK (ke J3)'}</p>`;
            info.signalStatus.innerHTML = Object.values(signals).map(data => {
                const isGreen = data.light.getAttribute('fill') === '#22c55e';
                return `<p>${data.name}: <span class="status-light ${isGreen ? 'light-green' : 'light-red'}"></span></p>`;
            }).join('');
        }

        function updateTombol() {
            buttons.keretaMasuk.disabled = gameState !== 'IDLE';
            buttons.lepasLoko.disabled = gameState !== 'ARRIVED_ON_J2';
            buttons.langsirViaJ1.disabled = gameState !== 'LOCO_AT_BADUG';
            buttons.kembaliKeRangkaian.disabled = gameState !== 'LOCO_SHUNTED';
            buttons.berangkatkanKereta.disabled = gameState !== 'READY_TO_DEPART';
        }

        function animateElement(element, path, duration, onEnd) {
    const oldAnimation = element.querySelector("animateMotion");
    if (oldAnimation) oldAnimation.remove();

    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
    animate.setAttribute("dur", `${duration}s`);
    animate.setAttribute("path", path.getAttribute("d"));
    animate.setAttribute("fill", "freeze");
    // TAMBAHKAN BARIS INI
    animate.setAttribute("rotate", "auto"); // Ini akan membuat gambar berputar mengikuti arah rel

    element.appendChild(animate);
    animate.beginElement();

    setTimeout(onEnd, duration * 1000);
}

        function checkSignal(signalId) { return signals[signalId].light.getAttribute('fill') === '#22c55e'; }

        function setSignal(id, color) {
            const signalData = signals[id];
            if (!signalData || !signalData.light) return;
            const targetColor = color === 'green' ? '#22c55e' : '#ef4444';
            signalData.light.setAttribute("fill", targetColor);
            logActivity(`Sinyal ${signalData.name} otomatis diatur ke ${color === 'green' ? 'AMAN' : 'BERHENTI'}.`, false, true);
            updateStatusDashboard();
        }

        function gerakkanWesel1() {
            wesel1Posisi = (wesel1Posisi === 'J1') ? 'J2&J3' : 'J1';
            if (wesel1Posisi === 'J1') {
                wesels.W1_to_J1.classList.remove('hidden');
                wesels.W1_to_J2J3.classList.add('hidden');
            } else {
                wesels.W1_to_J1.classList.add('hidden');
                wesels.W1_to_J2J3.classList.remove('hidden');
            }
            logActivity(`Wesel 1 diubah ke arah ${wesel1Posisi === 'J1' ? 'Jalur 1' : 'Jalur 2 & 3'}.`);
            updateStatusDashboard();
        }

        function gerakkanWesel2() {
            wesel2Posisi = (wesel2Posisi === 'J2') ? 'J3' : 'J2';
            if (wesel2Posisi === 'J3') {
                wesels.W2_to_J3.classList.remove('hidden');
                wesels.W2_to_J2.classList.add('hidden');
            } else {
                wesels.W2_to_J3.classList.add('hidden');
                wesels.W2_to_J2.classList.remove('hidden');
            }
            logActivity(`Wesel 2 diubah ke arah ${wesel2Posisi === 'J2' ? 'Jalur 2' : 'Jalur 3'}.`);
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

        function createButtons() {
            controlPanel.innerHTML = `
                <div class="button-group">
                    <button id="btn-toggle-S_in" class="btn-signal"><i class="fa-solid fa-traffic-light"></i> S-Masuk</button>
                    <button id="btn-toggle-S1_out" class="btn-signal"><i class="fa-solid fa-arrow-up"></i> S1-Keluar</button>
                    <button id="btn-toggle-S2_out" class="btn-signal"><i class="fa-solid fa-arrow-up"></i> S2-Keluar</button>
                    <button id="btn-toggle-S3_out" class="btn-signal"><i class="fa-solid fa-arrow-up"></i> S3-Keluar</button>
                    <button id="btn-toggle-S1_badug" class="btn-signal-langsir"><i class="fa-solid fa-arrow-down"></i> Langsir 1</button>
                    <button id="btn-toggle-S2_badug" class="btn-signal-langsir"><i class="fa-solid fa-arrow-down"></i> Langsir 2</button>
                </div>
                <div class="button-group">
                    <button id="btn-switch-wesel1" class="btn-switch"><i class="fa-solid fa-code-branch"></i> Wesel 1</button>
                    <button id="btn-switch-wesel2" class="btn-switch"><i class="fa-solid fa-code-branch"></i> Wesel 2</button>
                </div>
                <div class="button-group">
                    <button id="btn-kereta-masuk" class="btn-action"><i class="fa-solid fa-train"></i> Kereta Masuk</button>
                    <button id="btn-lepas-loko" class="btn-langsir" disabled><i class="fa-solid fa-unlink"></i> Lepas Loko</button>
                    <button id="btn-langsir-via-j1" class="btn-langsir" disabled><i class="fa-solid fa-route"></i> Langsir via J1</button>
                    <button id="btn-kembali-ke-rangkaian" class="btn-langsir" disabled><i class="fa-solid fa-link"></i> Kembali</button>
                    <button id="btn-berangkatkan-kereta" class="btn-action" disabled><i class="fa-solid fa-train-tram"></i> Berangkatkan</button>
                </div>
            `;
            buttons = {
                keretaMasuk: document.getElementById('btn-kereta-masuk'), lepasLoko: document.getElementById('btn-lepas-loko'),
                langsirViaJ1: document.getElementById('btn-langsir-via-j1'), kembaliKeRangkaian: document.getElementById('btn-kembali-ke-rangkaian'),
                berangkatkanKereta: document.getElementById('btn-berangkatkan-kereta'),
                wesel1: document.getElementById('btn-switch-wesel1'), wesel2: document.getElementById('btn-switch-wesel2')
            };
        }
        
        function attachEventListeners() {
            Object.keys(signals).forEach(id => {
                const btn = document.getElementById(`btn-toggle-${id}`);
                if (btn) btn.addEventListener("click", () => toggleSignal(id));
            });
            buttons.wesel1.addEventListener('click', gerakkanWesel1);
            buttons.wesel2.addEventListener('click', gerakkanWesel2);
            
            buttons.keretaMasuk.addEventListener('click', () => {
    // LOGIKA DIPERBAIKI: Pengecekan S2_out DIHAPUSKAN karena tidak logis.
    if (gameState !== 'IDLE' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S_in')) {
        logActivity("GAGAL: Syarat kereta masuk tidak terpenuhi! Pastikan wesel benar dan Sinyal Masuk hijau.", true); 
        return;
    }

    logActivity("Kereta mulai masuk ke Jalur 2..."); 
    gameState = 'ANIMATING'; 
    updateTombol();
    train.style.visibility = "visible";

    animateElement(train, rute.masuk_J2, 10, () => {
        setSignal('S_in', 'red'); // Sinyal masuk otomatis kembali merah setelah dilewati
        gameState = 'ARRIVED_ON_J2'; 
        logActivity("Kereta telah tiba di Jalur 2."); 
        updateTombol();
    });
});

            buttons.lepasLoko.addEventListener('click', () => {
                if (gameState !== 'ARRIVED_ON_J2' || !checkSignal('S2_badug')) {
                    logActivity("GAGAL: Syarat lepas lokomotif tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif dilepas dan bergerak ke sepur badug..."); gameState = 'ANIMATING'; updateTombol();
                carriages.style.visibility = 'hidden'; locomotive.style.visibility = 'visible'; train.style.visibility = 'hidden';
                animateElement(locomotive, rute.J2_to_badug, 5, () => {
                    setSignal('S2_badug', 'red');
                    gameState = 'LOCO_AT_BADUG'; logActivity("Lokomotif telah tiba di sepur badug."); updateTombol();
                });
            });

            buttons.langsirViaJ1.addEventListener('click', () => {
                if (gameState !== 'LOCO_AT_BADUG' || wesel1Posisi !== 'J1' || !checkSignal('S1_badug') || !checkSignal('S1_out')) {
                    logActivity("GAGAL: Syarat langsir via Jalur 1 tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif mulai langsir via Jalur 1..."); gameState = 'ANIMATING'; updateTombol();
                animateElement(locomotive, rute.badug_to_krenceng_via_J1, 15, () => {
                    setSignal('S1_badug', 'red');
                    setSignal('S1_out', 'red');
                    gameState = 'LOCO_SHUNTED'; logActivity("Lokomotif berhasil langsir keluar."); updateTombol();
                });
            });

            buttons.kembaliKeRangkaian.addEventListener('click', () => {
                if (gameState !== 'LOCO_SHUNTED' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S_in')) {
                    logActivity("GAGAL: Syarat lokomotif kembali tidak terpenuhi!", true); return;
                }
                logActivity("Lokomotif kembali untuk dirangkai..."); gameState = 'ANIMATING'; updateTombol();
                animateElement(locomotive, rute.krenceng_to_J2, 10, () => {
                    setSignal('S_in', 'red');
                    locomotive.style.visibility = 'hidden'; carriages.style.visibility = 'visible'; train.style.visibility = 'visible';
                    gameState = 'READY_TO_DEPART'; logActivity("Kereta telah dirangkai dan siap berangkat."); updateTombol();
                });
            });

            buttons.berangkatkanKereta.addEventListener('click', () => {
                if(gameState !== 'READY_TO_DEPART' || wesel1Posisi !== 'J2&J3' || wesel2Posisi !== 'J2' || !checkSignal('S2_out')) {
                    logActivity("GAGAL: Syarat keberangkatan tidak terpenuhi!", true); return;
                }
                logActivity("Kereta diberangkatkan menuju Rangkasbitung..."); gameState = 'ANIMATING'; updateTombol();
                animateElement(train, rute.masuk_J2, 10, () => { // Menggunakan rute masuk tapi dibalik
                    train.style.visibility = 'hidden';
                    setSignal('S2_out', 'red');
                    gameState = 'IDLE'; logActivity("Stasiun kembali normal. Simulasi selesai."); updateTombol();
                });
            });
        }

        // INISIALISASI GAME
        createButtons();
        attachEventListeners();
        logActivity("Simulasi PPKA Stasiun Merak dimulai.");
        updateStatusDashboard();
    });
});