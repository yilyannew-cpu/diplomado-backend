import { Request, Response, NextFunction } from 'express';
import { buildPublicUrl, filePathToDataUrl } from '../../../infrastructure/services/UploadService';

export async function uploadImageController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Archivo requerido (campo: file)' });
    }
    // Preferir data URL durable (Neon) frente a /uploads en disco efímero de Render.
    const url = filePathToDataUrl(req.file.path, req.file.mimetype);
    const publicUrl = buildPublicUrl(req, req.file.filename);
    res.status(201).json({
      url,
      public_url: publicUrl,
      width: 800,
      height: 600,
    });
  } catch (error) {
    next(error);
  }
}
