import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { serializeCategories, serializeCategory } from '../serializers/categorySerializer';
import { param } from '../utils/routeParams';
import { filePathToDataUrl } from '../../../infrastructure/services/UploadService';

export async function listCategoriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await container.listCategoriesUseCase.execute(param(req, 'restaurantId'));
    res.json(serializeCategories(categories));
  } catch (error) {
    next(error);
  }
}

export async function createCategoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await container.createCategoryUseCase.execute({
      name: req.body.name,
      position: req.body.position ?? 0,
      image: req.body.image ?? null,
      restaurantId: param(req, 'restaurantId'),
    });
    res.status(201).json(serializeCategory({ ...category, productCount: 0 }));
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await container.updateCategoryUseCase.execute(param(req, 'categoryId'), {
      name: req.body.name,
      position: req.body.position,
      image: req.body.image,
    });
    const full = await container.listCategoriesUseCase.execute(category.restaurantId);
    const withCount = full.find((c) => c.id === category.id);
    res.json(serializeCategory(withCount ?? { ...category, productCount: 0 }));
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryController(req: Request, res: Response, next: NextFunction) {
  try {
    await container.deleteCategoryUseCase.execute(param(req, 'categoryId'));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function uploadCategoryImageController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Archivo requerido' });
    }
    const url = filePathToDataUrl(req.file.path, req.file.mimetype);
    const category = await container.updateCategoryImageUseCase.execute(param(req, 'categoryId'), url);
    res.json(serializeCategory({ ...category, productCount: 0 }));
  } catch (error) {
    next(error);
  }
}
