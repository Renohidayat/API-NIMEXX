const axios = require('axios');
const https = require('https');

// Keep-alive agent for fast connection reuse
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 25,
  timeout: 8000
});

// In-memory cache store
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  const isFresh = Date.now() < entry.expireAt;
  return { data: entry.data, isFresh };
}

function setCached(key, data, ttlSeconds = 600) {
  cache.set(key, {
    data,
    expireAt: Date.now() + (ttlSeconds * 1000)
  });
  // Maintain max size to prevent memory leaks
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

const Service = {
  fetchService: async (url, res, ttlSeconds = 600) => {
    // 1. Check in-memory cache first
    const cached = getCached(url);
    if (cached && cached.isFresh) {
      return { status: 200, data: cached.data, fromCache: true };
    }

    // 2. Fetch with automatic retry
    const maxRetries = 4;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: 8000,
          httpsAgent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.google.com/',
          }
        });

        if (response && response.status === 200 && response.data) {
          const html = response.data.toString();
          // Do not cache Cloudflare challenge pages or block pages
          if (html.includes('<title>Just a moment...</title>') || html.includes('cf-browser-verification')) {
            throw new Error("Cloudflare challenge encountered");
          }

          // Store in cache
          setCached(url, response.data, ttlSeconds);
          return { status: 200, data: response.data };
        }
      } catch (error) {
        lastError = error;
        // Wait before next attempt with progressive backoff
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
      }
    }

    // 3. If all retries failed but stale cache exists, serve stale cache
    if (cached && cached.data) {
      console.warn(`⚠️ Network failed for ${url}, serving stale cache.`);
      return { status: 200, data: cached.data, fromCache: true, isStale: true };
    }

    // 4. All failed and no cache available
    console.error("❌ Failed to fetch URL after retries:", url);
    console.error("Error:", lastError?.message || lastError?.code);

    throw lastError || new Error("Failed to fetch data");
  }
};

module.exports = Service;