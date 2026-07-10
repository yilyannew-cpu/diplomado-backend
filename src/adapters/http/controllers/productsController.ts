import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { param } from '../utils/routeParams';
import { serializeProduct, serializeProducts } from '../serializers/productSerializer';
import { filePathToDataUrl } from '../../../infrastructure/services/UploadService';

export async function listProductsController(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      restaurantId: req.query.restaurantId as string,
      categoryId: req.query.categoryId as string,
      onlyAvailable: req.query.available === 'true' ? true : req.query.available === 'false' ? false : undefined,
    };
    const products = await container.listProductsUseCase.execute(filters);
    res.json(serializeProducts(products));
  } catch (error) {
    next(error);
  }
}

export async function getProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.getProductUseCase.execute(param(req, 'id'));
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

export async function createProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.createProductUseCase.execute({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      image: req.body.image,
      categoryId: req.body.category_id ?? req.body.categoryId,
      restaurantId: req.body.restaurant_id ?? req.body.restaurantId,
      available: req.body.available,
    });
    const full = await container.getProductUseCase.execute(product.id);
    res.status(201).json(serializeProduct(full));
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req: Request, res: Response, next: NextFunction) {
  try {
    await container.updateProductUseCase.execute(param(req, 'id'), {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      image: req.body.image,
      available: req.body.available,
      categoryId: req.body.category_id ?? req.body.categoryId,
    });
    const product = await container.getProductUseCase.execute(param(req, 'id'));
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

export async function toggleProductAvailabilityController(req: Request, res: Response, next: NextFunction) {
  try {
    await container.toggleAvailabilityUseCase.execute(param(req, 'id'));
    const product = await container.getProductUseCase.execute(param(req, 'id'));
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(req: Request, res: Response, next: NextFunction) {
  try {
    await container.deleteProductUseCase.execute(param(req, 'id'));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function uploadProductImageController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Archivo requerido' });
    }
    const url = filePathToDataUrl(req.file.path, req.file.mimetype);
    await container.updateProductImageUseCase.execute(param(req, 'id'), url);
    const product = await container.getProductUseCase.execute(param(req, 'id'));
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

export async function setProductIngredientsController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.setProductIngredientsUseCase.execute(
      param(req, 'id'),
      req.body.ingredients
    );
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

export async function setProductModifierGroupsController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await container.setProductModifierGroupsUseCase.execute(
      param(req, 'id'),
      req.body.modifier_groups ?? req.body.modifierGroups
    );
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}
