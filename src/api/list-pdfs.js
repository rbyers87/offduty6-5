import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const publicDir = path.join(__dirname, '../../../public'); // Adjust path to reach 'public'

      const files = await fs.readdir(publicDir);
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
      res.setHeader('Content-Type', 'application/json'); // Set the correct content type
      res.status(200).json({ pdfs });
    } catch (error) {
      console.error("Error in API handler:", error);
      res.status(500).json({ error: 'Failed to list PDFs' });
    }
  } else {
    res.setHeader('Content-Type', 'application/json'); // Ensure correct content type for error responses
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
