const axios = require('axios');

async function sendTelegram(msg) {
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: msg
    }
  );
}

async function compareAndAlert(today, yesterday) {
  for (let item of today) {
    const prev = yesterday[item.asin];
    if (!prev) continue;

    let alerts = [];

    if (prev.buybox !== item.buybox) {
      alerts.push(`BuyBox: ${prev.buybox} → ${item.buybox}`);
    }

    if (item.competitors > prev.competitors) {
      alerts.push(`Competitors: ${prev.competitors} → ${item.competitors}`);
    }

    if (alerts.length) {
      const msg = `Amazon Alert ASIN: ${item.asin} ${alerts.join('\n')} Price: ${item.price}`;
      await sendTelegram(msg);
    }
  }
}

module.exports = { compareAndAlert };