const { google } = require('googleapis');
const dayjs = require('dayjs');

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function ensureSheet(sheets) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID
  });

  const exists = meta.data.sheets.some(
    s => s.properties.title === 'Sentry_Logs'
  );

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Sentry_Logs' } } }]
      }
    });
  }
}

async function saveToSheet(data) {
  const sheets = await getSheets();
  await ensureSheet(sheets);

  const values = data.map(d => [
    d.date,
    d.asin,
    d.title,
    d.price,
    d.buybox,
    d.competitors
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sentry_Logs!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

async function getYesterdayData() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sentry_Logs!A:F'
  });

  const rows = res.data.values || [];
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const map = {};
  rows.forEach(r => {
    if (r[0] === yesterday) {
      map[r[1]] = {
        buybox: r[4],
        competitors: parseInt(r[5])
      };
    }
  });

  return map;
}

module.exports = { saveToSheet, getYesterdayData };