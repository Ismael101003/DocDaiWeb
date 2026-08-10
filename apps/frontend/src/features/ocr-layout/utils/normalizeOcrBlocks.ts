import type { OcrBlock as ApiOcrBlock } from '@/types/documents';

export interface OcrBlock extends ApiOcrBlock { id: string; page: number; }
export interface OverlayBounds { left: number; top: number; width: number; height: number; }

export function normalizeBoundingBox(polygon: Array<[number, number]>): OverlayBounds | null {
  if (polygon.length < 2) return null;
  const xValues = polygon.map(([x]) => x);
  const yValues = polygon.map(([, y]) => y);
  const left = Math.min(...xValues);
  const top = Math.min(...yValues);
  return { left, top, width: Math.max(...xValues) - left, height: Math.max(...yValues) - top };
}

export function scaleBoundingBox(bounds: OverlayBounds, sourceWidth: number, sourceHeight: number): OverlayBounds {
  return { left: (bounds.left / sourceWidth) * 100, top: (bounds.top / sourceHeight) * 100, width: (bounds.width / sourceWidth) * 100, height: (bounds.height / sourceHeight) * 100 };
}

export const normalizeOcrBlocks = (blocks: ApiOcrBlock[], page: number): OcrBlock[] => blocks.map((block, index) => ({ ...block, page, id: `${page}-${index}` }));
