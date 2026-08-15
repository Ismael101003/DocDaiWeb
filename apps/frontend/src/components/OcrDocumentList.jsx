const OcrDocumentList = ({ documents }) => {
  return (
    <section className="card shadow-sm">
      <div className="card-body">
        <h2 className="h5 mb-3">Documentos escaneados con OCR</h2>
        <div className="list-group list-group-flush">
          {documents.map((document) => (
            <div className="list-group-item px-0 d-flex justify-content-between align-items-start gap-3" key={document.id}>
              <div>
                <h3 className="h6 mb-1">{document.name}</h3>
                <p className="small text-body-secondary mb-0">{document.date}</p>
              </div>
              <span className={`badge ${document.statusClass}`}>{document.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default OcrDocumentList
