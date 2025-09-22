const axios = require('axios');

const Service = {
  fetchService: async (url, res) => {
    try {
      const response = await axios.get(url, {
        timeout: 7000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Referer': 'https://otakudesu.best/',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        }
      });
      return response;
    } catch (error) {
      console.error("❌ Error fetching URL:", url);

      // Log more error details
      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Status code:", error.response.status);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      res.status(500).json({
        status: false,
        code: error.code || 500,
        message: error.message || "Internal Server Error"
      });
      throw error;
    }
  }
};

module.exports = Service;
