import { useState } from 'react'

const ROLE_LABELS = {
  merchant: 'Ferretería aliada',
  customer: 'Cliente o constructor',
  transporter: 'Transportista',
}

function UserProfilePage({ user, onSave }) {
  const [name, setName] = useState(user.name)
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')
    setIsSaving(true)
    try {
      const updatedProfile = await onSave(name)
      setName(updatedProfile.name)
      setFeedback('Tu perfil se actualizó correctamente.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo actualizar tu perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">TU CUENTA</p><h1>Mi perfil</h1><p>Actualiza la información de tu cuenta.</p></div>
      </div>
      <section className="dashboard-panel role-profile-panel">
        <div className="panel-heading"><div><h2>Datos de la cuenta</h2><p>El correo y el tipo de usuario identifican tu cuenta.</p></div></div>
        <div className="role-profile-details">
          <div><span>Correo electrónico</span><strong>{user.email}</strong></div>
          <div><span>Tipo de usuario</span><strong>{ROLE_LABELS[user.role]}</strong></div>
        </div>
        <form className="dashboard-form profile-settings-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Nombre completo
            <input
              id="profile-name"
              name="name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <div className="profile-form-actions">
            <button className="button" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {feedback && <span role="status">{feedback}</span>}
          </div>
        </form>
      </section>
    </>
  )
}

export default UserProfilePage
