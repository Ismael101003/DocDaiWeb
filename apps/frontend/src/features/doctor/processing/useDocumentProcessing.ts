import { useCallback, useState } from 'react';
import { useDocuments } from '@/app/providers/DocumentsProvider';
import { extractOCR, parseMedicalInformation, prepareDocument, uploadDocument } from '@/services/documents';
import type { PipelineStep, ProcessingDocument, ProcessingLogEvent } from '@/types/documents';

const friendlyError: Record<PipelineStep, string> = {
  upload: 'No fue posible cargar el documento. Verifica el formato e inténtalo de nuevo.',
  prepare: 'No fue posible preparar el documento. Comprueba que el archivo sea legible e inténtalo de nuevo.',
  ocr: 'No fue posible ejecutar el OCR. Inténtalo de nuevo en unos momentos.',
  parse: 'No fue posible estructurar la información médica. Inténtalo de nuevo.',
  review: 'La revisión no está disponible todavía.',
};
const now = () => new Date().toISOString();

export function useDocumentProcessing() {
  const { activeDocument, addDocument, updateDocument } = useDocuments();
  const [events, setEvents] = useState<ProcessingLogEvent[]>([]);
  const [processingStep, setProcessingStep] = useState<PipelineStep | null>(null);
  const [completedThrough, setCompletedThrough] = useState<PipelineStep | null>(null);
  const [failedStep, setFailedStep] = useState<PipelineStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const log = useCallback((kind: ProcessingLogEvent['kind'], message: string) => setEvents((current) => [...current, { id: `${Date.now()}-${current.length}`, timestamp: now(), kind, message }]), []);
  const perform = useCallback(async (file?: File) => {
    setError(null); setFailedStep(null);
    let document = file ? undefined : activeDocument;
    let step: PipelineStep = 'upload';
    try {
      if (!document) {
        const sourceFile = file ?? retryFile;
        if (!sourceFile) return;
        setRetryFile(sourceFile);
        setProcessingStep('upload'); log('processing', 'Subiendo documento…');
        const uploaded = await uploadDocument(sourceFile);
        document = { id: uploaded.document_id, filename: uploaded.filename, size: sourceFile.size, createdAt: now(), stage: 'stored', previewUrl: URL.createObjectURL(sourceFile) };
        addDocument(document); log('success', `Documento cargado correctamente · ${uploaded.filename} · ID ${uploaded.document_id}`);
        setCompletedThrough('upload'); setRetryFile(null);
      }
      if (document.stage === 'stored') {
        step = 'prepare';
        setProcessingStep('prepare'); log('processing', 'Preparando documento…');
        const prepared = await prepareDocument(document.id);
        document = { ...document, stage: 'prepared', pages: prepared.pages }; updateDocument(document.id, { stage: 'prepared', pages: prepared.pages });
        log('success', `Documento preparado · ${prepared.pages} ${prepared.pages === 1 ? 'página' : 'páginas'}`);
        setCompletedThrough('prepare');
      }
      if (document.stage === 'prepared') {
        step = 'ocr';
        setProcessingStep('ocr'); log('processing', 'Ejecutando OCR…');
        const ocr = await extractOCR(document.id);
        document = { ...document, stage: 'processed', pages: ocr.pages, ocr }; updateDocument(document.id, { stage: 'processed', pages: ocr.pages, ocr });
        log('success', `OCR completado · confianza ${Math.round(ocr.confidence * 10000) / 100}% · ${ocr.pages} ${ocr.pages === 1 ? 'página' : 'páginas'}`);
        setCompletedThrough('ocr');
      }
      if (document.stage === 'processed') {
        step = 'parse';
        setProcessingStep('parse'); log('processing', 'Extrayendo información estructurada…');
        const parsed = await parseMedicalInformation(document.id);
        updateDocument(document.id, { stage: 'pending_human_review', parsed });
        log('success', 'Información estructurada obtenida'); log('review', 'Pendiente de revisión humana');
        setCompletedThrough('parse');
      }
      setProcessingStep(null);
    } catch (_cause) {
      const message = friendlyError[step]; setError(message); setFailedStep(step); setProcessingStep(null); log('error', message);
    }
  }, [activeDocument, addDocument, log, retryFile, updateDocument]);
  return { events, processingStep, completedThrough, failedStep, error, perform };
}
