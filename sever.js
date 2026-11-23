const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Clean minimal UI for Cinder
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cinder</title>
      <style>
        body { background: #111; color: #eee; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        h1 { letter-spacing: 4px; font-weight: 300; margin-bottom: 24px; }
        form { display: flex; gap: 8px; }
        input { width: 320px; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #1c1c1c; color: #fff; outline: none; }
        button { padding: 12px 20px; border-radius: 6px; border: none; background: #ff5722; color: #fff; font-weight: bold; cursor: pointer; }
        button:hover { background: #e64a19; }
      </style>
    </head>
    <body>
      <h1>CINDER</h1>
      <form action="/proxy" method="get">
        <input type="url" name="url" placeholder="https://example.com" required />
        <button type="submit">Go</button>
      </form>
    </body>
    </html>
  `);
});

// Proxy endpoint
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing URL parameter');

  try {
    const parsedUrl = new URL(targetUrl);
    const response = await fetch(parsedUrl.href);
    const contentType = response.headers.get('content-type') || '';

    res.set('Content-Type', contentType);

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseOrigin = parsedUrl.origin;

      html = html.replace(/(href|src)="\/([^"]*)"/g, `$1="/proxy?url=${encodeURIComponent(baseOrigin)}/$2"`);
      html = html.replace(/(href|src)="(https?:\/\/[^"]*)"/g, (_, attr, link) => {
        return `${attr}="/proxy?url=${encodeURIComponent(link)}"`;
      });

      return res.send(html);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    res.status(500).send(`Error fetching URL: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Cinder running locally at http://localhost:${PORT}`);
});
