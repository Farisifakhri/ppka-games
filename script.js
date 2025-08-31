document.addEventListener("DOMContentLoaded", function() {
    const stasiunObject = document.getElementById("stasiun");
    const controlPanel = document.getElementById("control-panel");
    
    stasiunObject.addEventListener("load", function() {
        const svgDoc = stasiunObject.contentDocument;
        if (!svgDoc) return;

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
            state: document.getElementById('info-state'), action: document.getElementById('info-action'),
            error: document.getElementById('info-error'), weselStatus: document.getElementById('wesel-status-display'),
            signalStatus: document.getElementById('signal-status-display'), log: document.getElementById('activity-log')
        };

        // MANAJEMEN STATUS GAME
        let gameState = 'IDLE';
        let wesel1Posisi = 'J2&J3';
        let wesel2Posisi = 'J2';
        let buttons = {};

        // FUNGSI-FUNGSI UTAMA
        function logActivity(message) { /* ... */ }
        function updateStatusDashboard() { /* ... */ }
        function updateTombol() { /* ... */ }
        function animateElement(element, path, duration, onEnd) { /* ... */ }
        function checkSignal(signalId) { /* ... */ }
        function gerakkanWesel1() { /* ... */ }
        function gerakkanWesel2() { /* ... */ }
        function toggleSignal(id) { /* ... */ }

        // FUNGSI PEMBUATAN TOMBOL
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
                </div>
            `;
            // Setelah dibuat, kumpulkan lagi referensi elemen tombolnya
            buttons = {
                keretaMasuk: document.getElementById('btn-kereta-masuk'), lepasLoko: document.getElementById('btn-lepas-loko'),
                langsirViaJ1: document.getElementById('btn-langsir-via-j1'), kembaliKeRangkaian: document.getElementById('btn-kembali-ke-rangkaian'),
                wesel1: document.getElementById('btn-switch-wesel1'), wesel2: document.getElementById('btn-switch-wesel2')
            };
        }
        
        // SAMBUNGKAN SEMUA FUNGSI KE TOMBOL
        function attachEventListeners() {
            Object.keys(signals).forEach(id => {
                const btn = document.getElementById(`btn-toggle-${id}`);
                if (btn) btn.addEventListener("click", () => toggleSignal(id));
            });
            buttons.wesel1.addEventListener('click', gerakkanWesel1);
            buttons.wesel2.addEventListener('click', gerakkanWesel2);
            buttons.keretaMasuk.addEventListener('click', () => { /* ... logika kereta masuk ... */ });
            buttons.lepasLoko.addEventListener('click', () => { /* ... logika lepas loko ... */ });
            buttons.langsirViaJ1.addEventListener('click', () => { /* ... logika langsir ... */ });
            buttons.kembaliKeRangkaian.addEventListener('click', () => { /* ... logika kembali ... */ });
        }

        // INISIALISASI GAME
        createButtons();
        attachEventListeners();
        logActivity("Simulasi PPKA Stasiun Merak dimulai.");
        updateStatusDashboard();
    });
});