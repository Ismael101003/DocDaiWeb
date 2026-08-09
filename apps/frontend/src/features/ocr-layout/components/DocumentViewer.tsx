import { useRef, useState } from 'react';
import type { DocumentPage } from '../types/ocrLayout.types';
import { OcrOverlay } from './OcrOverlay';
export function DocumentViewer({ page, totalPages, filename, onOcrSelect }: { page: DocumentPage; totalPages: number; filename: string; onOcrSelect: (text: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  return <section className="docdai-review-viewer"><header><strong>{filename}</strong><span>{page.number} / {totalPages}</span></header><div className="docdai-viewer-toolbar"><button type="button" aria-label="Alejar" onClick={() => setZoom((value) => Math.max(.6, value - .2))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Acercar" onClick={() => setZoom((value) => Math.min(2.2, value + .2))}>+</button><button type="button" onClick={() => { setZoom(1); canvasRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); }}>Restablecer</button></div><div ref={canvasRef} className="docdai-review-canvas">{page.src ? <div className="docdai-page-stage" style={{ transform: `scale(${zoom})` }}><img src={page.src} alt={`${filename}, ${page.label}`} onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} /><OcrOverlay page={page} imageSize={imageSize} onSelect={onOcrSelect} /></div> : <div className="docdai-page-unavailable"><strong>Vista de página no disponible</strong><span>Prepara el documento antes de revisarlo.</span></div>}</div></section>;
}
