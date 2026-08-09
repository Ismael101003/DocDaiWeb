import type { DocumentPage } from '../types/ocrLayout.types';
export function PageThumbnails({ pages, selected, onSelect }: { pages: DocumentPage[]; selected: number; onSelect: (page: number) => void }) {
  return <aside className="docdai-page-thumbnails" aria-label="Páginas del documento">{pages.map((page) => <button key={page.number} type="button" className={page.number === selected ? 'is-active' : ''} onClick={() => onSelect(page.number)}><span>{page.label}</span>{page.src ? <img src={page.src} alt="" /> : <span className="docdai-thumbnail-placeholder">Vista disponible al cargar</span>}</button>)}</aside>;
}
