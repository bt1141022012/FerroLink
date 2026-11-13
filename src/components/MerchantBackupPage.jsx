import { useRef, useState } from 'react'
import { exportAccountBackup, restoreAccountBackup } from '../services/localAuth'

const MAX_BACKUP_SIZE = 100 * 1024 * 1024

export default function MerchantBackupPage({ user, onRestored }) {
  const fileInput = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleExport() {
    setMessage('')
    setIsExporting(true)
    try {
      const backup = await exportAccountBackup(user.email)
      const contents = JSON.stringify(backup, null, 2)
      if (new TextEncoder().encode(contents).byteLength > MAX_BACKUP_SIZE) {
        throw new Error('El respaldo supera el límite de 100 MB. Descarga respaldos más pequeños.')
      }
      const file = new Blob([contents], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = `ferrolink-respaldo-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setIsError(false)
      setMessage(`Respaldo descargado: ${backup.products.length} productos y ${backup.orders.length} pedidos.`)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el respaldo.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleRestore(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setMessage('')
    if (file.size > MAX_BACKUP_SIZE) {
      setIsError(true)
      setMessage('El archivo supera el límite de 100 MB.')
      return
    }

    setIsRestoring(true)
    try {
      const contents = await file.text()
      let backup
      try {
        backup = JSON.parse(contents)
      } catch (error) {
        throw new Error('El archivo no contiene un respaldo JSON válido.', { cause: error })
      }

      const products = Array.isArray(backup?.products) ? backup.products.length : 0
      const orders = Array.isArray(backup?.orders) ? backup.orders.length : 0
      const confirmed = window.confirm(
        `Se reemplazarán los datos actuales de esta ferretería por ${products} productos y ${orders} pedidos del respaldo. Esta acción no se puede deshacer. ¿Deseas continuar?`,
      )
      if (!confirmed) return

      const restored = await restoreAccountBackup(user.email, backup)
      await onRestored()
      setIsError(false)
      setMessage(`Respaldo restaurado: ${restored.products} productos y ${restored.orders} pedidos.`)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'No se pudo restaurar el respaldo.')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">SEGURIDAD DE DATOS</p><h1>Respaldo de información</h1><p>Descarga o restaura los datos guardados de tu ferretería.</p></div>
      </div>
      {message && (
        <div className={`dashboard-feedback${isError ? ' backup-error' : ''}`} role={isError ? 'alert' : 'status'}>
          <span>{isError ? '!' : '✓'}</span>{message}
          <button type="button" onClick={() => setMessage('')} aria-label="Cerrar aviso">×</button>
        </div>
      )}
      <div className="backup-card-grid">
        <section className="dashboard-panel backup-card">
          <span className="backup-card-icon backup-download-icon" aria-hidden="true">↓</span>
          <p className="eyebrow">EXPORTAR</p>
          <h2>Descargar respaldo</h2>
          <p>Guarda una copia del perfil de tu ferretería, productos, inventario e historial de pedidos en un archivo JSON.</p>
          <button className="button" type="button" onClick={handleExport} disabled={isExporting || isRestoring}>
            {isExporting ? 'Preparando archivo...' : 'Descargar respaldo'}
          </button>
        </section>
        <section className="dashboard-panel backup-card">
          <span className="backup-card-icon backup-restore-icon" aria-hidden="true">↑</span>
          <p className="eyebrow">IMPORTAR</p>
          <h2>Restaurar respaldo</h2>
          <p>Selecciona un respaldo de FerroLink perteneciente a esta cuenta. La restauración reemplaza los datos actuales de la ferretería.</p>
          <input
            ref={fileInput}
            className="backup-file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleRestore}
            aria-label="Seleccionar archivo de respaldo"
          />
          <button
            className="secondary-button backup-restore-button"
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={isRestoring || isExporting}
          >
            {isRestoring ? 'Restaurando...' : 'Seleccionar respaldo'}
          </button>
        </section>
      </div>
      <p className="backup-note">La restauración solo acepta archivos creados para la cuenta actualmente conectada. Conserva tus respaldos en un lugar seguro.</p>
    </>
  )
}
