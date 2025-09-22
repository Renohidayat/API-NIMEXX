const express = require("express");
const router = express.Router();
const Services = require("../controller/services");
const fetch = require("node-fetch");

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

// Proxy image
router.get("/api/v1/proxy-image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send("Missing url param");

        const response = await fetch(imageUrl);
        if (!response.ok) return res.status(response.status).send("Failed to fetch image");

        res.set("Content-Type", response.headers.get("content-type"));
        response.body.pipe(res);
    } catch (error) {
        console.error("Error in proxy-image:", error.message);
        res.status(500).send("Internal server error");
    }
});

// API routes
router.get("/api/v1/ongoing/:page", Services.getOngoing);
router.get("/api/v1/completed/:page", Services.getCompleted);
router.get("/api/v1/search/:q", Services.getSearch);
router.get("/api/v1/anime-list", Services.getAnimeList);
router.get("/api/v1/detail/:endpoint", Services.getAnimeDetail);
router.get("/api/v1/episode/:endpoint", Services.getAnimeEpisode);
router.get("/api/v1/batch/:endpoint", Services.getBatchLink);
router.get("/api/v1/genres", Services.getGenreList);
router.get("/api/v1/genres/:genre/:page", Services.getGenrePage);
router.get("/api/v1/streaming/:content", Services.getEmbedByContent);

module.exports = router;
