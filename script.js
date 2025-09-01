document.addEventListener("DOMContentLoaded", function() {
    
    // --- MANAJEMEN ELEMEN ---
    // Mengambil semua elemen interaktif dari halaman lobi
    const loadingScreen = document.getElementById('loading-screen');
    const lobbyScreen = document.getElementById('lobby-screen');
    const newGameBtn = document.getElementById('new-game-btn');
    const progressBar = document.getElementById('progress-bar');
    const menuButtons = document.querySelectorAll('.menu-btn:not(.disabled)');

    // --- EFEK SUARA (OPSIONAL) ---
    // Aa bisa menambahkan file audio .mp3 atau .wav di folder assets
    // dan hapus komentar di bawah ini untuk mengaktifkannya.
    // const hoverSound = new Audio('assets/sounds/ui-hover.wav');
    // const clickSound = new Audio('assets/sounds/ui-click.wav');

    /**
     * Fungsi untuk menampilkan layar tertentu dan menyembunyikan yang lain.
     * @param {HTMLElement} screen - Elemen layar yang ingin ditampilkan.
     */
    function showScreen(screen) {
        // Sembunyikan semua layar terlebih dahulu
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        // Tampilkan layar yang dipilih dengan transisi fade-in
        screen.classList.add('active');
    }

    /**
     * Mensimulasikan proses loading dengan mengisi progress bar.
     */
    function simulateLoading() {
        let width = 0;
        const interval = setInterval(() => {
            width += 25;
            progressBar.style.width = width + '%';
            
            // Jika progress bar sudah penuh
            if (width >= 100) {
                clearInterval(interval);
                // Beri jeda sedikit agar animasi progress bar terlihat selesai,
                // lalu tampilkan layar lobi.
                setTimeout(() => showScreen(lobbyScreen), 700);
            }
        }, 400); // Progress bar akan terisi penuh dalam ~1.6 detik
    }

    /**
     * Menangani event klik pada tombol "Mulai Simulasi".
     */
    function handleNewGameClick() {
        // clickSound.play(); // Mainkan suara klik jika ada
        
        // Ubah tampilan tombol untuk memberikan feedback ke pemain
        newGameBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat Simulasi...';
        newGameBtn.disabled = true;
        
        // Arahkan ke halaman simulasi (game.html) setelah jeda singkat
        // agar pemain melihat animasi loading di tombol.
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1500); // Jeda 1.5 detik
    }

    // --- INISIALISASI EVENT LISTENERS ---

    // Pasang event listener untuk tombol "Mulai Simulasi"
    newGameBtn.addEventListener('click', handleNewGameClick);

    // Pasang event listener untuk efek suara hover pada semua tombol yang aktif
    menuButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            // hoverSound.play(); // Mainkan suara hover jika ada
        });
    });

    // --- MULAI APLIKASI ---
    // Jalankan simulasi loading saat halaman pertama kali dibuka.
    simulateLoading();
});

