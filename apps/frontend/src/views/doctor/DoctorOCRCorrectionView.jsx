const DoctorOCRCorrectionView = ({ documentName, extractedData }) => {
  return (
    <section className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 mb-1">Verificacion OCR</h1>
        <p className="text-body-secondary mb-0">Corrige la informacion extraida antes de enviarla a revision clinica.</p>
      </div>
      <form className="row g-4">
        <div className="col-lg-5">
          <section className="ddw-ocr-viewer ddw-readonly">
            <div className="card-body">
              <h2 className="h5 mb-3">Documento adjunto</h2>
              <div className="ddw-ocr-viewer__frame">
                <div className="text-center p-4">
                  <div className="ddw-ocr-viewer__badge" aria-hidden="true">PDF</div>
                  <p className="mb-0 ddw-ocr-viewer__filename">{documentName}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="col-lg-7">
          <section className="ddw-ocr-panel">
            <div className="card-body">
              <h2 className="h5 mb-3">Informacion extraida</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ocrPatientName">Nombre del paciente</label>
                  <input className="form-control" id="ocrPatientName" id="ocrPatientName" type="text" defaultValue={extractedData.patientName} />
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
                <div className="col-12 ddw-ocr-panel__actions">
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
