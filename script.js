// Menunggu seluruh halaman HTML siap
document.addEventListener("DOMContentLoaded", function() {
    console.log("Halaman HTML selesai dimuat. Menunggu SVG...");
    const stasiunObject = document.getElementById("stasiun");

    if (!stasiunObject) {
        console.error("Elemen <object> dengan ID 'stasiun' tidak ditemukan!");
        return;
    }

    stasiunObject.addEventListener("load", function() {
        console.log("SVG berhasil dimuat! Mulai inisialisasi game...");
        const svgDoc = stasiunObject.contentDocument;

        if (!svgDoc) {
            console.error("Gagal mengakses dokumen SVG.");
            return;
        }

        // === KUMPULKAN SEMUA ELEMEN INTERAKTIF DARI SVG ===
        const signals = {
            S1: svgDoc.getElementById("S1_light"),
            S2: svgDoc.getElementById("S2_light"), // Sekarang seharusnya ditemukan
            S3: svgDoc.getElementById("S3_light"),
            S_in: svgDoc.getElementById("S_in_light"),
            S_access: svgDoc.getElementById("S_access_light")
        };
        console.log("Elemen sinyal:", signals);

        const train = svgDoc.getElementById("train");
        const rute = {
            jalur1: svgDoc.getElementById("path_route_track1"), // Pastikan ID ini ada di XML
            jalur2: svgDoc.getElementById("path_route_track2")  // Pastikan ID ini ada di XML
        };
        const legend = {
            weselStatus: svgDoc.getElementById("legend-wesel-status"),
            indicatorJalur1: svgDoc.getElementById("indicator-jalur1"),
            indicatorJalur2: svgDoc.getElementById("indicator-jalur2")
        };

        let ruteAktif = 'jalur2';

        // === FUNGSI-FUNGSI LOGIKA GAME ===
        function updateLegend() {
            if (!legend.weselStatus) return; // Pengaman jika legenda tidak ada
            if (ruteAktif === 'jalur2') {
                legend.weselStatus.textContent = "LURUS (Jalur 2)";
                legend.indicatorJalur1.setAttribute("fill", "#9aa0a6");
                legend.indicatorJalur2.setAttribute("fill", "#22c55e");
            } else {
                legend.weselStatus.textContent = "BELOK (Jalur 1)";
                legend.indicatorJalur1.setAttribute("fill", "#22c55e");
                legend.indicatorJalur2.setAttribute("fill", "#9aa0a6");
            }
        }

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
            if (id === 'wesel1') {
                ruteAktif = (ruteAktif === 'jalur2') ? 'jalur1' : 'jalur2';
                console.log(`Wesel 1 diatur ke ${ruteAktif}`);
                updateLegend();
            }
        }

        function jalankanKereta() {
            console.log("Tombol jalankan kereta ditekan. Mengecek kondisi...");
            // Pengaman jika salah satu sinyal tidak ditemukan
            if (!signals.S_in || !signals.S1 || !signals.S2) {
                alert("Kesalahan: Ada elemen sinyal penting yang tidak ditemukan. Periksa kembali file SVG.");
                return;
            }

            const sinyalMasukHijau = signals.S_in.getAttribute("fill") === "#22c55e";
            const sinyalKeluarHijau = (ruteAktif === 'jalur1' && signals.S1.getAttribute("fill") === "#22c55e") ||
                                      (ruteAktif === 'jalur2' && signals.S2.getAttribute("fill") === "#22c55e");

            console.log(`Sinyal Masuk Hijau: ${sinyalMasukHijau}, Sinyal Keluar Hijau: ${sinyalKeluarHijau}`);

            if (!sinyalMasukHijau || !sinyalKeluarHijau) {
                alert("Sinyal belum aman! Pastikan S-IN dan sinyal keluar untuk rute yang dipilih (S1 atau S2) berwarna HIJAU.");
                return;
            }
            
            // ... sisa fungsi jalankanKereta (tidak ada perubahan) ...
            const rutePilihan = rute[ruteAktif];
            if (!rutePilihan) {
                console.error(`Path rute untuk ${ruteAktif} tidak ditemukan!`);
                return;
            }
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
                const oldAnimation = train.querySelector("animateMotion");
                if (oldAnimation) oldAnimation.remove();
                console.log("Kereta sampai di tujuan.");
            }, 15000);
        }

        updateLegend();

        // === SAMBUNGKAN TOMBOL HTML KE FUNGSI JS ===
        document.getElementById("btn-toggle-s1").addEventListener("click", () => toggleSignal('S1'));
        document.getElementById("btn-toggle-s2").addEventListener("click", () => toggleSignal('S2'));
        document.getElementById("btn-toggle-s3").addEventListener("click", () => toggleSignal('S3'));
        document.getElementById("btn-toggle-s_in").addEventListener("click", () => toggleSignal('S_in'));
        document.getElementById("btn-toggle-s_access").addEventListener("click", () => toggleSignal('S_access'));
        document.getElementById("btn-switch-wesel1").addEventListener("click", () => toggleWesel('wesel1'));
        document.getElementById("btn-switch-wesel2").addEventListener("click", () => alert("Logika wesel 2 belum dibuat!"));
        document.getElementById("btn-jalankan-kereta").addEventListener("click", jalankanKereta);

        console.log("Semua tombol berhasil terhubung!");
    });
});