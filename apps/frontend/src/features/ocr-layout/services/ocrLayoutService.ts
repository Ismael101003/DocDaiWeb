import { API_BASE_URL } from '@/services/documents';
import type { ReviewField, ReviewRequest, ReviewResponse } from '../types/ocrLayout.types';

export const reviewPersistenceAvailable = true;

class ReviewApiError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
	}
}

async function request<T>(path: string, body: ReviewRequest): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	const payload: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const detail =
			typeof payload === 'object' && payload && 'detail' in payload && typeof payload.detail === 'string'
				? payload.detail
				: 'No fue posible completar la revisión.';
		throw new ReviewApiError(detail, response.status);
	}

	return payload as T;
}

function toReviewRequest(fields: ReviewField[], reviewedBy?: string | null): ReviewRequest {
	return {
		reviewed_by: reviewedBy ?? undefined,
		fields: fields.map((field) => ({
			field: field.evidence.field,
			original_value: field.originalValue,
			value: field.value,
			status: field.status,
			source_text: field.evidence.source_text,
			match_type: field.evidence.match_type,
			page: field.evidence.page,
			confidence: field.evidence.confidence,
		})),
	};
}

export function saveReview(documentId: string, fields: ReviewField[], reviewedBy?: string | null) {
	return request<ReviewResponse>(`/documents/${encodeURIComponent(documentId)}/review`, toReviewRequest(fields, reviewedBy));
}

export function approveReview(documentId: string, fields: ReviewField[], reviewedBy?: string | null) {
	return request<ReviewResponse>(`/documents/${encodeURIComponent(documentId)}/review/approve`, toReviewRequest(fields, reviewedBy));
}

