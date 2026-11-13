import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'

const PRODUCT_CATEGORIES = ['Construcción', 'Electricidad', 'Fontanería', 'Herramientas', 'Pinturas', 'Otros']
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
const MAX_STORED_IMAGE_SIZE = 1_500_000
export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=640&q=80'

async function prepareProductImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.')
  if (file.size > MAX_IMAGE_FILE_SIZE) throw new Error('La imagen debe pesar menos de 10 MB.')

  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo procesar la imagen.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/webp', 0.8)
    if (dataUrl.length > MAX_STORED_IMAGE_SIZE) {
      throw new Error('La imagen procesada supera el límite permitido. Prueba con otra imagen.')
    }
    return dataUrl
  } finally {
    image.close()
  }
}

function ProductDialog({ product, onClose, onSave, isSaving }) {
  const [image, setImage] = useState(product?.image ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [isOffer, setIsOffer] = useState(product?.isOffer ?? false)
  const [offerPrice, setOfferPrice] = useState(String(product?.offerPrice ?? product?.price ?? ''))
  const [offerDescription, setOfferDescription] = useState(product?.offerDescription ?? product?.name ?? '')
  const [offerStartDate, setOfferStartDate] = useState(product?.offerStartDate ?? '')
  const [imageError, setImageError] = useState('')
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await onSave({
      id: product?.id,
      name: formData.get('name'),
      category: formData.get('category'),
      sku: formData.get('sku'),
      price: formData.get('price'),
      stock: formData.get('stock'),
      available: formData.has('available'),
      isOffer,
      offerPrice: formData.get('offerPrice'),
      offerDescription: formData.get('offerDescription'),
      offerStartDate: formData.get('offerStartDate'),
      offerEndDate: formData.get('offerEndDate'),
      image,
    })
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImageError('')
    setIsProcessingImage(true)
    try {
      setImage(await prepareProductImage(file))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'No se pudo procesar la imagen.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">CATÁLOGO</p>
            <h2 id="product-dialog-title">{product ? 'Editar producto' : 'Agregar producto'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label>Nombre del producto<input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Ej. Cemento gris 42.5 kg" required /></label>
          <div className="form-grid">
            <label>Categoría
              <select name="category" defaultValue={product?.category ?? PRODUCT_CATEGORIES[0]}>
                {PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>Código / SKU <span className="optional-label">Opcional</span><input name="sku" defaultValue={product?.sku ?? ''} maxLength={60} placeholder="Ej. CEM-001" /></label>
          </div>
          <div className="form-grid">
            <label>Precio (USD)<input name="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" required /></label>
            <label>Existencias<input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required /></label>
          </div>
          <div className="product-image-field">
            <label htmlFor="product-image">Imagen del producto <span className="optional-label">Opcional</span></label>
            <div className="product-image-control">
              <span className="product-image-preview">
                {image
                  ? <img src={image} alt="Vista previa del producto" />
                  : <img src={DEFAULT_PRODUCT_IMAGE} alt="Vista previa predeterminada de construcción" />}
              </span>
              <span className="product-image-actions">
                <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
                <small>JPG, PNG, WebP o GIF. Se optimiza al cargar.</small>
                {image && <button className="remove-image-button" type="button" onClick={() => setImage('')}>Usar imagen predeterminada</button>}
              </span>
            </div>
            {isProcessingImage && <span className="image-processing">Procesando imagen...</span>}
            {imageError && <span className="image-error" role="alert">{imageError}</span>}
          </div>
          <label className="dashboard-checkbox"><input type="checkbox" name="available" defaultChecked={product?.available ?? true} /><span>Disponible para la venta</span></label>
          <label className="dashboard-checkbox"><input type="checkbox" checked={isOffer} onChange={(event) => {
            const enabled = event.target.checked
            setIsOffer(enabled)
            if (enabled) {
              setOfferPrice(price)
              setOfferDescription(name)
            }
          }} /><span>Incluir en ofertas durante un rango de fechas</span></label>
          {isOffer && (
            <>
              <div className="form-grid">
                <label>Precio de oferta (USD)
                  <input
                    name="offerPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                    required
                  />
                </label>
                <label>Descripción de la oferta
                  <input
                    name="offerDescription"
                    type="text"
                    maxLength={240}
                    value={offerDescription}
                    onChange={(event) => setOfferDescription(event.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="form-grid offer-date-fields">
                <label>Fecha de inicio
                  <input
                    name="offerStartDate"
                    type="date"
                    value={offerStartDate}
                    onChange={(event) => setOfferStartDate(event.target.value)}
                    required
                  />
                </label>
                <label>Fecha de finalización
                  <input
                    name="offerEndDate"
                    type="date"
                    min={offerStartDate || undefined}
                    defaultValue={product?.offerEndDate ?? ''}
                    required
                  />
                </label>
              </div>
            </>
          )}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
            <button className="button" type="submit" disabled={isSaving || isProcessingImage}>{isSaving ? 'Guardando...' : 'Guardar producto'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProductTable({ products, onEdit, onDelete, onToggleAvailability, isSaving }) {
  if (!products.length) {
    return (
      <div className="dashboard-empty">
        <span>▤</span>
        <h3>Tu catálogo está listo para empezar</h3>
        <p>Agrega productos para organizar existencias y precios.</p>
        <button className="button" type="button" onClick={() => onEdit(null)}>Agregar primer producto <ArrowIcon /></button>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th>Estado</th><th>Oferta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><span className="product-table-name">
                <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
                <span><strong>{product.name}</strong><small>{product.sku || 'Sin código'}</small></span>
              </span></td>
              <td>{product.category}</td>
              <td className="table-emphasis">{formatCurrency(product.price)}</td>
              <td><span className={`stock-count${product.stock < 5 ? ' stock-low' : ''}`}>{product.stock}</span></td>
              <td><button className={`status-pill ${product.available ? 'status-available' : 'status-paused'}`} type="button" onClick={() => onToggleAvailability(product)} disabled={isSaving}>{product.available ? 'Disponible' : 'Pausado'}</button></td>
              <td>{product.isOffer
                ? <span className="product-offer-range">{formatCurrency(product.offerPrice)} · {product.offerStartDate} – {product.offerEndDate}</span>
                : '—'}</td>
              <td><div className="row-actions"><button type="button" onClick={() => onEdit(product)}>Editar</button><button type="button" className="delete-action" onClick={() => onDelete(product)}>Eliminar</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 10h11m-4.5-4.5 4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ProductsPage({
  products,
  onSaveProduct,
  onDeleteProduct,
  onToggleAvailability,
  isLoading,
  isSaving,
}) {
  const [editingProduct, setEditingProduct] = useState(undefined)

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">INVENTARIO</p><h1>Catálogo de productos</h1><p>Gestiona precios, existencias y disponibilidad.</p></div>
        <button className="button" type="button" onClick={() => setEditingProduct(null)}>Agregar producto <span className="plus-sign">+</span></button>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Productos <span className="count-badge">{products.length}</span></h2><p>Los cambios se reflejan en tu inventario.</p></div></div>
        {isLoading
          ? <div className="compact-empty">Cargando catálogo...</div>
          : <ProductTable
            products={products}
            onEdit={setEditingProduct}
            onDelete={onDeleteProduct}
            onToggleAvailability={onToggleAvailability}
            isSaving={isSaving}
          />}
      </section>
      {editingProduct !== undefined && (
        <ProductDialog
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSave={async (details) => {
            const saved = await onSaveProduct(details)
            if (saved) setEditingProduct(undefined)
          }}
          isSaving={isSaving}
        />
      )}
    </>
  )
}
