const mcache = new Map();

const cacheResponse = (durationInSeconds = 600) => {
  return (req, res, next) => {
    // We only want to cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = '__express__' + (req.originalUrl || req.url);
    const cachedBody = mcache.get(key);
    
    // If cache is fresh, send it immediately without parsing or fetching
    if (cachedBody && Date.now() < cachedBody.expireAt) {
      res.set('Cache-Control', `public, max-age=${durationInSeconds}`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(cachedBody.data);
    } else {
      // Manage memory: clear if too large
      if (mcache.size > 2000) {
        mcache.clear();
      }

      // Intercept response
      const originalJson = res.json;
      const originalSend = res.send;

      res.json = function (body) {
        if (res.statusCode === 200) {
          let shouldCache = true;
          try {
            if (
              (body.ongoing && body.ongoing.length === 0) ||
              (body.completed && body.completed.length === 0) ||
              (body.search && body.search.length === 0) ||
              (body.genreAnime && body.genreAnime.length === 0) ||
              (body.anime_list && body.anime_list.length === 0)
            ) {
              shouldCache = false;
            }
          } catch (e) {}

          if (shouldCache) {
            mcache.set(key, {
              data: body,
              expireAt: Date.now() + (durationInSeconds * 1000)
            });
          }
        }
        return originalJson.call(this, body);
      };

      res.send = function (body) {
        if (res.statusCode === 200) {
          let shouldCache = true;
          try {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            if (
              (parsed.ongoing && parsed.ongoing.length === 0) ||
              (parsed.completed && parsed.completed.length === 0) ||
              (parsed.search && parsed.search.length === 0) ||
              (parsed.genreAnime && parsed.genreAnime.length === 0) ||
              (parsed.anime_list && parsed.anime_list.length === 0)
            ) {
              shouldCache = false;
            }
          } catch (e) {}

          if (shouldCache) {
            mcache.set(key, {
              data: body,
              expireAt: Date.now() + (durationInSeconds * 1000)
            });
          }
        }
        return originalSend.call(this, body);
      };

      next();
    }
  };
};

module.exports = cacheResponse;
