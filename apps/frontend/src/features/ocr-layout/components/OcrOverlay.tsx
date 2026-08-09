import { useMemo, useState } from 'react';
import type { DocumentPage } from '../types/ocrLayout.types';
import { normalizeBoundingBox, normalizeOcrBlocks, scaleBoundingBox } from '../utils/normalizeOcrBlocks';

export function OcrOverlay({ page, imageSize, onSelect }: { page: DocumentPage; imageSize: { width: number; height: number } | null; onSelect: (text: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blocks = useMemo(() => normalizeOcrBlocks(page.blocks, page.number), [page.blocks, page.number]);
  if (!blocks.length) return <div className="docdai-overlay-note">No se detectaron bloques OCR para esta página.</div>;
  const positioned = imageSize ? blocks.map((block) => ({ block, bounds: normalizeBoundingBox(block.polygon) })).filter((item): item is { block: typeof blocks[number]; bounds: NonNullable<ReturnType<typeof normalizeBoundingBox>> } => item.bounds !== null) : [];
  if (!positioned.length || !imageSize) return <div className="docdai-overlay-note">El OCR conserva texto por línea; esta ejecución no proporcionó coordenadas para dibujar cajas.</div>;
  return <div className="docdai-ocr-overlay">{positioned.map(({ block, bounds }) => { const style = scaleBoundingBox(bounds, imageSize.width, imageSize.height); return <button key={block.id} type="button" aria-label={`Seleccionar texto OCR: ${block.text}`} className={`docdai-ocr-box ${selectedId === block.id ? 'is-selected' : ''}`} style={{ left: `${style.left}%`, top: `${style.top}%`, width: `${style.width}%`, height: `${style.height}%` }} onClick={() => { setSelectedId(block.id); onSelect(block.text); }} />; })}</div>;
}
