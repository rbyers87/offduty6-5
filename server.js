import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5173; // Or any other port you prefer

app.get('/api/list-pdfs', async (req, res) => {
  const publicDir = path.join(__dirname, 'public');
  try {
    const files = await fs.readdir(publicDir);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ pdfs: pdfFiles });
  } catch (err) {
    console.error('Error reading directory:', err);
    res.status(500).json({ error: 'Failed to list PDFs' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
