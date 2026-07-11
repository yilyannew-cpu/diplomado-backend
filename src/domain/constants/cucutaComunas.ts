/** Comunas oficiales de Cúcuta (10). */
export const CUCUTA_COMUNAS = [
  'Centro',
  'Centro Oriental',
  'Oriental Oriental',
  'Oriental Occidental',
  'Occidental',
  'Sur Occidental',
  'Sur Oriental',
  'Norte',
  'Atalaya',
  'La Libertad',
] as const;

export type CucutaComuna = (typeof CUCUTA_COMUNAS)[number];

export function isCucutaComuna(value: string): value is CucutaComuna {
  return (CUCUTA_COMUNAS as readonly string[]).includes(value);
}
