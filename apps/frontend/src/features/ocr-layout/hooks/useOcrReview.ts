import { useDocuments } from '@/app/providers/DocumentsProvider';
export function useOcrReview(documentId: string | undefined) {
	const { documents, selectDocument, updateDocument } = useDocuments();
	const document = documents.find((item) => item.id === documentId);
	return { document, selectDocument, updateDocument };
}
