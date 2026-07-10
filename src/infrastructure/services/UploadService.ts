import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Memoria + disco: el buffer se usa para data URL durable en Neon;
 * el archivo en disco sirve en local / mientras el contenedor viva.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Use jpg, png o webp'));
    }
  },
});

export function buildPublicUrl(
  req: { protocol: string; get: (name: string) => string | undefined },
  filename: string
): string {
  const configured = process.env.BASE_URL?.replace(/\/$/, '');
  if (configured) {
    return `${configured}/uploads/${filename}`;
  }

  const host = req.get('host') ?? 'localhost:3000';
  const isRender = host.includes('onrender.com');
  const protocol = isRender ? 'https' : req.protocol === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/uploads/${filename}`;
}

/**
 * Data URL a partir del archivo ya escrito en disco.
 * Se guarda en Neon para que las imágenes sobrevivan redeploys de Render (disco efímero).
 */
export function filePathToDataUrl(filePath: string, mimetype: string): string {
  const buffer = fs.readFileSync(filePath);
  const mime = mimetype || 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export { UPLOAD_DIR };
