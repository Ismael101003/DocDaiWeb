const DoctorOCRCorrectionView = ({ documentName, extractedData }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Verificacion OCR</h1>
        <p className="text-body-secondary mb-0">Corrige la informacion extraida antes de enviarla a revision clinica.</p>
      </div>
      <form className="row g-4">
        <div className="col-lg-5">
          <section className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Documento adjunto</h2>
              <div className="ratio ratio-4x3 bg-secondary-subtle border rounded d-flex align-items-center justify-content-center">
                <div className="text-center p-4">
                  <div className="display-5 text-secondary mb-2">PDF</div>
                  <p className="mb-0 text-body-secondary">{documentName}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="col-lg-7">
          <section className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Informacion extraida</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ocrPatientName">Nombre del paciente</label>
                  <input className="form-control" id="ocrPatientName" type="text" defaultValue={extractedData.patientName} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ocrStudyDate">Fecha del estudio</label>
                  <input className="form-control" id="ocrStudyDate" type="date" defaultValue={extractedData.studyDate} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ocrStudyType">Tipo de estudio</label>
                  <input className="form-control" id="ocrStudyType" type="text" defaultValue={extractedData.studyType} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ocrDoctor">Medico responsable</label>
                  <input className="form-control" id="ocrDoctor" type="text" defaultValue={extractedData.doctor} />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="ocrFindings">Hallazgos</label>
                  <textarea className="form-control" id="ocrFindings" rows="5" defaultValue={extractedData.findings} />
                </div>
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" type="reset">Restaurar</button>
                  <button className="btn btn-primary" type="submit">Guardar correcciones</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </section>
  )
}

export default DoctorOCRCorrectionView
