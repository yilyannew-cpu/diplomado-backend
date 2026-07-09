import { Request, Response, NextFunction } from 'express';
import { buildPublicUrl } from '../../../infrastructure/services/UploadService';

export async function uploadImageController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Archivo requerido (campo: file)' });
    }
    const url = buildPublicUrl(req, req.file.filename);
    res.status(201).json({
      url,
      width: 800,
      height: 600,
    });
  } catch (error) {
    next(error);
  }
}
