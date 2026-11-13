import { useState } from 'react'

export default function MerchantTransportersPage({
  transporters,
  associatedEmails,
  onSave,
  isSaving,
}) {
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    const formData = new FormData(event.currentTarget)
    const selectedEmails = formData.getAll('transporter').map(String)
    try {
      const saved = await onSave(selectedEmails)
      if (!saved) return
      setMessage('Transportistas asociados actualizados.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron guardar los transportistas.')
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">ENTREGAS</p>
          <h1>Mis transportistas</h1>
          <p>Selecciona quiénes podrán ser asignados a los pedidos de tu ferretería.</p>
        </div>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Cuentas de transportistas</h2>
            <p>Solo los transportistas seleccionados aparecerán en el selector de cada pedido.</p>
          </div>
          <span className="count-badge">{associatedEmails.length} asociados</span>
        </div>
        {!transporters.length
          ? (
            <div className="compact-empty">
              No hay cuentas de transportista registradas en este navegador. Crea una cuenta con el perfil Transportista y aparecerá aquí.
            </div>
          )
          : (
            <form className="transporter-association-form" onSubmit={handleSubmit}>
              <div className="transporter-choice-list">
                {transporters.map((transporter) => (
                  <label className="transporter-choice" key={transporter.email}>
                    <input
                      type="checkbox"
                      name="transporter"
                      value={transporter.email}
                      defaultChecked={associatedEmails.includes(transporter.email)}
                      disabled={isSaving}
                    />
                    <span className="transporter-choice-avatar">{transporter.name.slice(0, 1).toUpperCase()}</span>
                    <span className="transporter-choice-details">
                      <strong>{transporter.name}</strong>
                      <small>{transporter.email}</small>
                    </span>
                    <span className="transporter-choice-role">Transportista</span>
                  </label>
                ))}
              </div>
              <div className="transporter-association-actions">
                {message && <span role="status">{message}</span>}
                <button className="button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar transportistas asociados'}
                </button>
              </div>
            </form>
          )}
      </section>
    </>
  )
}
