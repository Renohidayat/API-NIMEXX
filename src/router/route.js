const express = require("express");
const router = express.Router();
const Services = require("../controller/services");
const fetch = require("node-fetch");
const cacheResponse = require("../helper/cacheResponse");

// Root endpoint info
router.get("/", (req, res) => {
    console.log("Root endpoint accessed");
    res.send({
        message: "API is running",
        endpoint: {
            getOngoingAnime: "/api/v1/ongoing/:page",
            getCompletedAnime: "/api/v1/completed/:page",
            getAnimeSearch: "/api/v1/search/:q",
            getAnimeList: "/api/v1/anime-list",
            getAnimeDetail: "/api/v1/detail/:endpoint",
            getAnimeEpisode: "/api/v1/episode/:endpoint",
            getBatchLink: "/api/v1/batch/:endpoint",
            getGenreList: "/api/v1/genres",
            getGenrePage: "/api/v1/genres/:genre/:page",
            proxyImage: "/api/v1/proxy-image?url={image_url}"
        }
    });
});

// Proxy image with cache and retry
router.get("/api/v1/proxy-image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send("Missing url param");

        res.set("Cache-Control", "public, max-age=604800, immutable");

        let lastErr;
        for (let i = 0; i < 3; i++) {
            try {
                const response = await fetch(imageUrl, {
                    timeout: 8000,
                    headers: {
                        'Referer': 'https://otakudesu.blog/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                if (response.ok) {
                    res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
                    return response.body.pipe(res);
                }
            } catch (e) {
                lastErr = e;
                await new Promise(r => setTimeout(r, 200));
            }
        }
        if (!res.headersSent) res.status(404).send("Image not found");
    } catch (error) {
        if (!res.headersSent) res.status(500).send("Internal server error");
    }
});

// API routes with Aggressive Caching (Extremely Fast)
// 600s (10 min) cache for dynamic things like ongoing, completed
router.get("/api/v1/ongoing/:page", cacheResponse(600), Services.getOngoing);
router.get("/api/v1/completed/:page", cacheResponse(600), Services.getCompleted);
router.get("/api/v1/search/:q", cacheResponse(600), Services.getSearch);

// 3600s (1 hr) cache for static things like anime list and genres
router.get("/api/v1/anime-list", cacheResponse(3600), Services.getAnimeList);
router.get("/api/v1/detail/:endpoint", cacheResponse(3600), Services.getAnimeDetail);
router.get("/api/v1/episode/:endpoint", cacheResponse(3600), Services.getAnimeEpisode);
router.get("/api/v1/batch/:endpoint", cacheResponse(3600), Services.getBatchLink);
router.get("/api/v1/genres", cacheResponse(3600), Services.getGenreList);
router.get("/api/v1/genres/:genre/:page", cacheResponse(3600), Services.getGenrePage);
router.get("/api/v1/streaming/:content", cacheResponse(3600), Services.getEmbedByContent);

module.exports = router;
