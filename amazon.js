const axios = require('axios');
const aws4 = require('aws4');
const dayjs = require('dayjs');

const HOST = 'sellingpartnerapi-eu.amazon.com';

// LWA Token
async function getAccessToken() {
  const res = await axios.post('https://api.amazon.com/auth/o2/token', {
    grant_type: 'refresh_token',
    refresh_token: process.env.LWA_REFRESH_TOKEN,
    client_id: process.env.LWA_CLIENT_ID,
    client_secret: process.env.LWA_CLIENT_SECRET
  });
  return res.data.access_token;
}

// Signed API Call
async function callSPAPI(path, token, query = {}) {
  const url = new URL(`https://${HOST}${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));

  const opts = {
    host: HOST,
    path: url.pathname + url.search,
    service: 'execute-api',
    region: process.env.REGION,
    method: 'GET',
    headers: {
      'x-amz-access-token': token,
      'content-type': 'application/json'
    }
  };

  aws4.sign(opts, {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  });

  const res = await axios({
    url: url.toString(),
    method: 'GET',
    headers: opts.headers
  });

  return res.data;
}

// MAIN FUNCTION
async function fetchAmazonData(asins) {
  const token = await getAccessToken();
  const results = [];

  for (let asin of asins) {
    try {
      const offersRes = await callSPAPI(
        `/products/pricing/v0/items/${asin}/offers`,
        token,
        {
          MarketplaceId: process.env.MARKETPLACE_ID,
          ItemCondition: 'New'
        }
      );

      const offers = offersRes.payload?.Offers || [];
      const buybox = offers.find(o => o.IsBuyBoxWinner);

      const catalogRes = await callSPAPI(
        `/catalog/2022-04-01/items/${asin}`,
        token,
        {
          marketplaceIds: process.env.MARKETPLACE_ID
        }
      );

      const title = catalogRes?.summaries?.[0]?.itemName || 'N/A';

      results.push({
        date: dayjs().format('YYYY-MM-DD'),
        asin,
        title,
        price: buybox?.ListingPrice?.Amount || 0,
        buybox: buybox ? 'YES' : 'NO',
        competitors: offers.length
      });

      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`Amazon error ${asin}`, err.response?.data || err.message);
    }
  }

  return results;
}

module.exports = { fetchAmazonData };