import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteImageTrainingExample,
  getImageModelMetadata,
  getImageTrainingExamples,
  getPublicCatalogProducts,
  saveImageTrainingExample,
} from '../services/localAuth'
import { formatDate } from '../utils/formatters'

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024

export default function AdminTrainingPage() {
  const [products, setProducts] = useState([])
  const [examples, setExamples] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const [catalog, savedExamples, modelMetadata] = await Promise.all([
      getPublicCatalogProducts(),
      getImageTrainingExamples(),
      getImageModelMetadata(),
    ])
    setProducts(catalog)
    setExamples(savedExamples)
    setMetadata(modelMetadata)
    setSelectedProductId((current) => catalog.some((product) => product.id === current)
      ? current
      : catalog[0]?.id ?? '')
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      getPublicCatalogProducts(),
      getImageTrainingExamples(),
      getImageModelMetadata(),
    ])
      .then(([catalog, savedExamples, modelMetadata]) => {
        if (!active) return
        setProducts(catalog)
        setExamples(savedExamples)
        setMetadata(modelMetadata)
        setSelectedProductId(catalog[0]?.id ?? '')
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los datos de entrenamiento.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  const exampleCounts = useMemo(() => {
    const counts = new Map()
    for (const example of examples) {
      counts.set(example.productId, (counts.get(example.productId) ?? 0) + 1)
    }
    return counts
  }, [examples])

  async function handleImagesChange(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setMessage('')
    setError('')
    if (!files.length) return
    if (!selectedProductId) {
      setError('Primero selecciona el producto al que pertenecen las imágenes.')
      return
    }

    const product = products.find((item) => item.id === selectedProductId)
    if (!product) {
      setError('El producto seleccionado ya no está disponible.')
      return
    }

    setIsProcessing(true)
    let added = 0
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_FILE_SIZE) {
          throw new Error('Cada archivo debe ser una imagen de menos de 10 MB.')
        }
        const { extractProductImageEmbedding } = await import('../services/productImageModel')
        const embedding = await extractProductImageEmbedding(file)
        await saveImageTrainingExample(product.id, product.name, embedding)
        added += 1
      }
      await reload()
      setMessage(`${added} ${added === 1 ? 'imagen agregada' : 'imágenes agregadas'} para ${product.name}.`)
    } catch (processingError) {
      const errorMessage = processingError instanceof Error
        ? processingError.message
        : 'No se pudieron procesar las imágenes.'
      try {
        await reload()
        setError(added
          ? `${errorMessage} Se guardaron ${added} ${added === 1 ? 'imagen' : 'imágenes'} antes del error.`
          : errorMessage)
      } catch (reloadError) {
        const reloadMessage = reloadError instanceof Error
          ? reloadError.message
          : 'No se pudieron actualizar los ejemplos guardados.'
        setError(`${errorMessage} ${reloadMessage}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleExampleDelete(example) {
    setError('')
    setMessage('')
    try {
      await deleteImageTrainingExample(example.id)
      await reload()
      setMessage('Imagen de entrenamiento eliminada.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la imagen.')
    }
  }

  async function handleTrain() {
    setError('')
    setMessage('')
    setIsProcessing(true)
    setTrainingProgress('Preparando MobileNet...')
    try {
      const { trainMobileNetProductClassifier } = await import('../services/productImageModel')
      const trainedMetadata = await trainMobileNetProductClassifier(examples, (epoch, totalEpochs) => {
        setTrainingProgress(`Entrenando clasificador: época ${epoch} de ${totalEpochs}`)
      })
      setMetadata(trainedMetadata)
      setMessage('El modelo de búsqueda visual se entrenó y guardó en este navegador.')
      setTrainingProgress('')
    } catch (trainingError) {
      setError(trainingError instanceof Error
        ? trainingError.message
        : 'No se pudo entrenar el modelo.')
    } finally {
      setIsProcessing(false)
      setTrainingProgress('')
    }
  }

  const classCounts = [...exampleCounts.entries()]
  const trainable = classCounts.filter(([, count]) => count >= 2).length >= 2

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN · INTELIGENCIA ARTIFICIAL</p>
          <h1>Entrenar búsqueda visual</h1>
          <p>Etiqueta fotos de productos para entrenar un clasificador con características de MobileNet.</p>
        </div>
      </div>
      {message && <div className="dashboard-feedback" role="status"><span>✓</span>{message}</div>}
      {error && <div className="dashboard-feedback backup-error" role="alert"><span>!</span>{error}</div>}
      <section className="dashboard-panel admin-model-status">
        <div className="panel-heading">
          <div>
            <h2>Estado del modelo</h2>
            <p>{metadata
              ? `Entrenado ${formatDate(metadata.trainedAt)} con ${metadata.exampleCount} imágenes y ${metadata.classes.length} productos.`
              : 'Todavía no hay un modelo de productos guardado en este navegador.'}</p>
          </div>
          <span className={`customer-order-status${metadata ? ' order-status-entregado' : ''}`}>
            {metadata ? 'Entrenado' : 'Sin entrenar'}
          </span>
        </div>
        <div className="admin-model-note">
          MobileNet convierte cada foto en características visuales. TensorFlow.js entrena un clasificador sobre esas características; las imágenes y el modelo permanecen en IndexedDB de este navegador.
        </div>
      </section>
      <section className="dashboard-panel admin-training-panel">
        <div className="panel-heading">
          <div><h2>Imágenes etiquetadas</h2><p>Agrega al menos dos imágenes por producto y etiqueta dos o más productos distintos.</p></div>
          <span className="count-badge">{examples.length} imágenes</span>
        </div>
        {isLoading
          ? <div className="compact-empty">Cargando productos y ejemplos...</div>
          : (
            <div className="admin-training-content">
              {!products.length
                ? <div className="compact-empty">No hay productos disponibles. Registra productos con existencias desde el portal de una ferretería en este navegador.</div>
                : (
                  <div className="admin-training-upload">
                    <label>Producto para etiquetar
                      <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} disabled={isProcessing}>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · {product.shopName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>Fotos de referencia
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                        disabled={isProcessing}
                      />
                    </label>
                    <small>Usa fotos variadas, claras y centradas en el producto. MobileNet se cargará desde internet la primera vez.</small>
                  </div>
                )}
              {examples.length
                ? (
                  <div className="admin-example-list">
                    {examples.map((example) => (
                      <article className="admin-example-item" key={example.id}>
                        <span className="admin-example-icon" aria-hidden="true">▧</span>
                        <span><strong>{example.productName}</strong><small>Imagen etiquetada · {formatDate(example.createdAt)}</small></span>
                        <button type="button" className="row-actions-button" onClick={() => handleExampleDelete(example)} disabled={isProcessing}>Eliminar</button>
                      </article>
                    ))}
                  </div>
                )
                : <p className="admin-training-empty">Aún no has agregado imágenes de entrenamiento.</p>}
              <div className="admin-training-footer">
                <span>{classCounts.filter(([, count]) => count >= 2).length} productos con dos o más imágenes</span>
                <button className="button" type="button" onClick={handleTrain} disabled={!trainable || isProcessing}>
                  {isProcessing ? 'Procesando...' : metadata ? 'Volver a entrenar' : 'Entrenar MobileNet'}
                </button>
              </div>
              {trainingProgress && <p className="admin-training-progress" role="status">{trainingProgress}</p>}
            </div>
          )}
      </section>
    </>
  )
}
