require('dotenv').config();

const { fetchAmazonData } = require('./amazon');
const { saveToSheet, getYesterdayData } = require('./googleSheet');
const { compareAndAlert } = require('./telegram');

const ASINS = ['B0XXXXXXX1', 'B0XXXXXXX2'];

async function main() {
  try {
    console.log("Job started...");

    const todayData = await fetchAmazonData(ASINS);
    const yesterdayData = await getYesterdayData();

    await saveToSheet(todayData);
    await compareAndAlert(todayData, yesterdayData);

    console.log("Job completed ✅");

  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();