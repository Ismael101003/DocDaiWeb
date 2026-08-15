const StatBarList = ({ stats }) => {
  return (
    <div className="vstack gap-3">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="d-flex justify-content-between mb-1">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
          <div className="progress" role="progressbar" aria-label={stat.label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={stat.percent}>
            <div className={`progress-bar ${stat.widthClass} ${stat.className}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatBarList
