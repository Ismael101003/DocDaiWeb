export function ReviewActions({ pending, busy, approved, onSave, onApprove }: { pending: number; busy?: boolean; approved?: boolean; onSave: () => void; onApprove: () => void }) {
	return (
		<footer className="docdai-review-actions">
			<span>
				<strong>{pending > 0 ? `Faltan ${pending} campos por validar` : 'Todos los campos fueron validados'}</strong>
				<small>{busy ? 'Procesando revisión en el backend.' : pending > 0 ? 'Selecciona cada campo y registra una decisión clínica antes de finalizar.' : 'La aprobación enviará la revisión al backend y finalizará el expediente.'}</small>
			</span>
			<div className="d-flex gap-2">
				<button type="button" className="btn btn-outline-primary" disabled={busy} onClick={onSave}>
					Guardar cambios
				</button>
				<button type="button" className="btn btn-primary" disabled={pending > 0 || busy || approved} title={pending > 0 ? `Faltan ${pending} campos por validar` : undefined} aria-describedby={pending > 0 ? 'review-pending-help' : undefined} onClick={onApprove}>
					{busy ? 'Procesando...' : approved ? '✓ Revisado' : 'Aprobar y finalizar'}
				</button>
				{pending > 0 ? <span id="review-pending-help" className="visually-hidden">Valida los campos pendientes para habilitar esta acción.</span> : null}
			</div>
		</footer>
	);
}
