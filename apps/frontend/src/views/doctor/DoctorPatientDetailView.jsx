import OcrDocumentList from '../../components/OcrDocumentList.jsx'
import PatientGeneralInfo from '../../components/PatientGeneralInfo.jsx'

const DoctorPatientDetailView = ({ documents, patient, onScanDocument }) => {
  return (
    <section className="container-fluid">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Detalle del paciente</h1>
          <p className="text-body-secondary mb-0">Revision clinica y documentos procesados con OCR.</p>
        </div>
        <button className="btn btn-success btn-lg" type="button" onClick={onScanDocument}>
          Escanear nuevo documento
        </button>
      </div>
      <div className="row g-4">
        <div className="col-lg-5">
          <PatientGeneralInfo patient={patient} />
        </div>
        <div className="col-lg-7">
          <OcrDocumentList documents={documents} />
        </div>
      </div>
    </section>
  )
}

export default DoctorPatientDetailView
