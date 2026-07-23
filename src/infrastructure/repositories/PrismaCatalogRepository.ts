import { prisma } from '../database/prisma/client';

export type CatalogComuna = {
  id: string;
  code: string;
  label: string;
  position: number;
};

export type CatalogVehicleType = {
  id: string;
  code: string;
  label: string;
  position: number;
  requires_plate: boolean;
};

export type CatalogMenuCategory = {
  id: string;
  name: string;
  position: number;
};

export class PrismaCatalogRepository {
  async listComunas(): Promise<CatalogComuna[]> {
    const rows = await prisma.comuna.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      position: r.position,
    }));
  }

  async listVehicleTypes(): Promise<CatalogVehicleType[]> {
    const rows = await prisma.vehicleTypeCatalog.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      position: r.position,
      requires_plate: r.requires_plate,
    }));
  }

  async listMenuCategoryTemplates(): Promise<CatalogMenuCategory[]> {
    const rows = await prisma.menuCategoryTemplate.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
    }));
  }

  async isValidComunaCode(code: string): Promise<boolean> {
    const row = await prisma.comuna.findFirst({
      where: { code, active: true },
      select: { id: true },
    });
    return Boolean(row);
  }

  async isValidVehicleTypeCode(code: string): Promise<boolean> {
    const row = await prisma.vehicleTypeCatalog.findFirst({
      where: { code, active: true },
      select: { id: true },
    });
    return Boolean(row);
  }
}
