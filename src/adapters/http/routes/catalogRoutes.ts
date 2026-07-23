import { Router } from 'express';
import {
  listComunasController,
  listVehicleTypesController,
  listMenuCategoryTemplatesController,
} from '../controllers/catalogController';

/** Catálogos públicos (registro / selects). */
export const catalogRouter = Router();

catalogRouter.get('/comunas', listComunasController);
catalogRouter.get('/vehicle-types', listVehicleTypesController);
catalogRouter.get('/menu-category-templates', listMenuCategoryTemplatesController);
