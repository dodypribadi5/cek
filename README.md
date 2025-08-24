# Aplikasi Kirim Pesan ke Telegram

Aplikasi sederhana untuk mengirim pesan ke Telegram melalui website.

## Cara Deploy ke Vercel

1. **Buat Repository GitHub**
   - Buat repository baru di GitHub
   - Upload semua file ke repository

2. **Deploy ke Vercel**
   - Login ke [Vercel](https://vercel.com)
   - Pilih "Import Project"
   - Pilih repository GitHub Anda
   - Klik "Deploy"

3. **Atur Environment Variables**
   - Di dashboard Vercel, masuk ke project Settings
   - Pilih "Environment Variables"
   - Tambahkan variabel berikut:
     - `TELEGRAM_BOT_TOKEN` = Token bot Telegram Anda
     - `TELEGRAM_CHAT_ID` = Chat ID tujuan

## Cara Mendapatkan Token Bot Telegram

1. Chat dengan [@BotFather](https://t.me/BotFather) di Telegram
2. Ketik `/newbot` dan ikuti instruksi
3. Salin token yang diberikan

## Cara Mendapatkan Chat ID

1. Kirim pesan ke bot [@userinfobot](https://t.me/userinfobot) di Telegram
2. Bot akan membalas dengan Chat ID Anda

## Struktur Project
