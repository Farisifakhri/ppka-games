// Menunggu hingga seluruh halaman (termasuk SVG) selesai dimuat
window.addEventListener("load", function() {
    const stasiunObject = document.getElementById("stasiun");
    
    stasiunObject.addEventListener("load", function() {
        const svgDoc = stasiunObject.contentDocument;
        if (!svgDoc) {
            console.error("Gagal memuat dokumen SVG.");
            return;
        }

        console.log("SVG Stasiun Merak berhasil dimuat!");

        // === KUMPULKAN SEMUA ELEMEN INTERAKTIF DARI SVG ===
        const signals = {
            S1: svgDoc.getElementById("S1_light"),
            S2: svgDoc.getElementById("S2_light"),
            S_in: svgDoc.getElementById("S_in_light")
        };

        const train = svgDoc.getElementById("train");
        const ruteJalur1 = svgDoc.getElementById("path_route_track1");
        const ruteJalur2 = svgDoc.getElementById("path_route_track2");

        // === FUNGSI-FUNGSI LOGIKA GAME (TIDAK PERLU 'window.' LAGI) ===

        function toggleSignal(id) {
            const light = signals[id];
            if (!light) {
                console.warn(`Sinyal dengan ID ${id} tidak ditemukan.`);
                return;
            }
            const isRed = light.getAttribute("fill") === "#b91c1c";
            light.setAttribute("fill", isRed ? "#22c55e" : "#b91c1c");
            console.log(`Sinyal ${id} diubah menjadi ${isRed ? 'HIJAU' : 'MERAH'}`);
        }

        function toggleWesel(id) {
            console.log(`Fungsi untuk wesel ${id} belum diimplementasikan.`);
            alert("Logika wesel belum dibuat!");
        }

        function jalankanKereta() {
            if (!train) {
                console.error("Grup elemen 'train' tidak ditemukan di SVG.");
                return;
            }
            const rutePilihan = ruteJalur2;
            if (!rutePilihan) {
                console.error("Path rute untuk kereta tidak ditemukan!");
                return;
            }

            console.log("Menjalankan kereta di rute Jalur 2...");
            train.style.visibility = "visible";
            
            const oldAnimation = train.querySelector("animateMotion");
            if (oldAnimation) oldAnimation.remove();

            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            animate.setAttribute("dur", "15s");
            animate.setAttribute("begin", "indefinite");
            animate.setAttribute("fill", "freeze");
            animate.setAttribute("rotate", "auto");
            animate.setAttribute("path", rutePilihan.getAttribute("d"));

            train.appendChild(animate);
            animate.beginElement();
            
            setTimeout(() => {
                train.style.visibility = "hidden";
                console.log("Kereta sampai di tujuan.");
            }, 15000);
        }

        // === SAMBUNGKAN TOMBOL HTML KE FUNGSI JS (CARA MODERN) ===
        document.getElementById("btn-toggle-s1").addEventListener("click", () => toggleSignal('S1'));
        document.getElementById("btn-toggle-s2").addEventListener("click", () => toggleSignal('S2'));
        document.getElementById("btn-toggle-s_in").addEventListener("click", () => toggleSignal('S_in'));
        document.getElementById("btn-switch-wesel1").addEventListener("click", () => toggleWesel('wesel1'));
        document.getElementById("btn-switch-wesel2").addEventListener("click", () => toggleWesel('wesel2'));
        document.getElementById("btn-jalankan-kereta").addEventListener("click", jalankanKereta);

        console.log("Semua tombol berhasil terhubung!");
    });
});