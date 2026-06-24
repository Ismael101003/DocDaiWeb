import { patientProfile } from '@/data/mockData';

export function PatientProfilePage() {
  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h4 mb-2">Perfil del paciente</h2>
            <p className="text-secondary mb-0">Datos personales y un resumen rápido del historial médico.</p>
          </div>
          <span className="badge text-bg-secondary">Perfil listo</span>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Información personal</h3>
                <div className="d-grid gap-3">
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Nombre</span><span className="fw-semibold text-end">{patientProfile.fullName}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">ID del paciente</span><span className="fw-semibold text-end">{patientProfile.patientId}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Fecha de nacimiento</span><span className="fw-semibold text-end">{patientProfile.dateOfBirth}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Tipo de sangre</span><span className="fw-semibold text-end">{patientProfile.bloodType}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Contacto de emergencia</span><span className="fw-semibold text-end">{patientProfile.emergencyContact}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Resumen del historial médico</h3>
                <div className="d-grid gap-3">
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Alergias conocidas</div>
                    <div className="fw-semibold">{patientProfile.allergies}</div>
                  </div>
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Condiciones activas</div>
                    <div className="fw-semibold">{patientProfile.conditions}</div>
                  </div>
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Notas de atención</div>
                    <div className="text-secondary">
                      El expediente está estructurado para facilitar la revisión médica y luego podrá conectarse con laboratorios, recetas y citas.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
