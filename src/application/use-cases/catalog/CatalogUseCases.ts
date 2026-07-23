import { PrismaCatalogRepository } from '../../../infrastructure/repositories/PrismaCatalogRepository';

export class ListComunasUseCase {
  constructor(private catalogRepo: PrismaCatalogRepository) {}
  execute() {
    return this.catalogRepo.listComunas();
  }
}

export class ListVehicleTypesUseCase {
  constructor(private catalogRepo: PrismaCatalogRepository) {}
  execute() {
    return this.catalogRepo.listVehicleTypes();
  }
}

export class ListMenuCategoryTemplatesUseCase {
  constructor(private catalogRepo: PrismaCatalogRepository) {}
  execute() {
    return this.catalogRepo.listMenuCategoryTemplates();
  }
}
