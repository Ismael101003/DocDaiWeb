import { patientProfile } from '@/data/mockData';

export function PatientProfilePage() {
  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h4 mb-2">Patient profile</h2>
            <p className="text-secondary mb-0">Personal details and a quick summary of medical history.</p>
          </div>
          <span className="badge text-bg-secondary">Profile ready</span>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Personal information</h3>
                <div className="d-grid gap-3">
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Name</span><span className="fw-semibold text-end">{patientProfile.fullName}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Patient ID</span><span className="fw-semibold text-end">{patientProfile.patientId}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Date of birth</span><span className="fw-semibold text-end">{patientProfile.dateOfBirth}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Blood type</span><span className="fw-semibold text-end">{patientProfile.bloodType}</span></div>
                  <div className="d-flex justify-content-between gap-3"><span className="text-secondary">Emergency contact</span><span className="fw-semibold text-end">{patientProfile.emergencyContact}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card border-0 bg-light rounded-4 h-100">
              <div className="card-body p-4">
                <h3 className="h6 mb-3">Medical history summary</h3>
                <div className="d-grid gap-3">
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Known allergies</div>
                    <div className="fw-semibold">{patientProfile.allergies}</div>
                  </div>
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Active conditions</div>
                    <div className="fw-semibold">{patientProfile.conditions}</div>
                  </div>
                  <div className="p-3 rounded-4 bg-white">
                    <div className="small text-secondary mb-1">Care notes</div>
                    <div className="text-secondary">
                      The record is structured for easy doctor review and can later connect to lab, prescription, and appointment services.
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
