// Pastikan variabel svgDocument sudah didefinisikan dan mendapatkan elemen SVG root
let svgDocument; // Ini harus didapatkan dari `object` onload

document.getElementById("stasiun").addEventListener("load", function() {
    svgDocument = this.contentDocument;

    // --- Definisi fungsi lainnya di sini ---
    // (misalnya toggleSignal, toggleWesel)

    // Dapatkan elemen lokomotif dari SVG
    const keretaLokomotif = svgDocument.getElementById("kereta-lokomotif");
    
    // Periksa apakah lokomotif ditemukan
    if (!keretaLokomotif) {
        console.error("Elemen 'kereta-lokomotif' tidak ditemukan di SVG.");
        return; // Hentikan fungsi jika tidak ditemukan
    }

    // Fungsi jalankanKereta yang baru
    function jalankanKereta() {
        console.log("Kereta dijalankan!");

        // Inisialisasi posisi awal (baca dari SVG)
        let currentY = parseFloat(keretaLokomotif.getAttribute("y"));
        let currentX = parseFloat(keretaLokomotif.getAttribute("x"));

        // Kecepatan pergerakan (dalam piksel per interval)
        const speed = 2; // Bisa disesuaikan

        // Jarak yang ingin ditempuh (misal, keluar layar ke bawah)
        const targetY = 650; // Lebih jauh dari tinggi SVG
        
        const animationInterval = setInterval(() => {
            if (currentY < targetY) {
                currentY += speed;
                keretaLokomotif.setAttribute("y", currentY);
            } else {
                clearInterval(animationInterval); // Hentikan animasi saat mencapai target
                console.log("Kereta telah keluar dari stasiun.");
                // Mungkin bisa reset posisi kereta kembali ke awal jika ingin dimainkan lagi
                // keretaLokomotif.setAttribute("y", "400"); 
                // keretaLokomotif.setAttribute("x", "288"); 
            }
        }, 30); // Interval 30ms

    }

    // --- Sambungkan ke tombol "Jalankan Kereta" ---
    document.getElementById("btnJalankanKereta").addEventListener("click", jalankanKereta);

});