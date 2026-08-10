export function ReviewActions({ pending, busy, onSave, onApprove }: { pending: number; busy?: boolean; onSave: () => void; onApprove: () => void }) {
	return (
		<footer className="docdai-review-actions">
			<span>
				<strong>Campos pendientes: {pending}</strong>
				<small>{busy ? 'Procesando revisión en el backend.' : 'Los cambios se guardan en el snapshot de revisión.'}</small>
			</span>
			<div className="d-flex gap-2">
				<button type="button" className="btn btn-outline-primary" disabled={busy} onClick={onSave}>
					Guardar cambios
				</button>
				<button type="button" className="btn btn-primary" disabled={pending > 0 || busy} onClick={onApprove}>
					{busy ? 'Procesando...' : 'Aprobar revisión'}
				</button>
			</div>
		</footer>
	);
}
