const express = require('express');
const cors = require('cors');
const app = express();
const route = require("./src/router/route");
const { inject } = require("@vercel/analytics");

inject();  

app.use(cors());  // Izinkan CORS secara global
app.use(route);   // Gunakan route dari file router

// Penanganan error global (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Penanganan route yang tidak dikenal
app.all('*', (req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Tentukan port dan jalankan server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

