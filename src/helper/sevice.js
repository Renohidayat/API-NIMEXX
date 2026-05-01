const cloudscraper = require('cloudscraper');

const Service = {
  fetchService: async (url, res) => {
    try {
      const data = await cloudscraper.get({
        uri: url,
        timeout: 15000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
        }
      });
      return { status: 200, data };
    } catch (error) {
      console.error("❌ Error fetching URL:", url);
      console.error("Status code:", error.statusCode || error.code);
      console.error("Error message:", error.message);

      res.status(error.statusCode || 500).json({
        status: false,
        code: error.statusCode || error.code || 500,
        message: error.message || "Internal Server Error"
      });
      throw error;
    }
  }
};

module.exports = Service;