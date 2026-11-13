import { useEffect, useMemo, useState } from 'react'
import { createCustomerOrder, getPublicCatalogProducts } from '../services/localAuth'
import { DEFAULT_PRODUCT_IMAGE } from './ProductsPage'
import { formatCurrency } from '../utils/formatters'

function OrderDialog({ product, customerName, onClose, onSubmit, isSaving }) {
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    try {
      await onSubmit({
        productId: product.id,
        customerName: formData.get('customerName'),
        deliveryAddress: formData.get('deliveryAddress'),
        quantity: formData.get('quantity'),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar el pedido.')
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <section className="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-order-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">NUEVO PEDIDO</p>
            <h2 id="customer-order-title">Confirma tu pedido</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={isSaving} aria-label="Cerrar">×</button>
        </div>
        <div className="checkout-product">
          <span className="checkout-product-icon">▤</span>
          <span><strong>{product.name}</strong><small>{product.shopName} · {product.stock} disponibles</small></span>
          <strong>{formatCurrency(product.price)}</strong>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label>Nombre para el pedido<input name="customerName" defaultValue={customerName} maxLength={120} required /></label>
          <div className="form-grid">
            <label>Cantidad
              <input
                name="quantity"
                type="number"
                min="1"
                max={product.stock}
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
              />
            </label>
            <label>Dirección de entrega<input name="deliveryAddress" maxLength={180} placeholder="Calle, colonia, municipio" required /></label>
          </div>
          <div className="checkout-total"><span>Total del pedido</span><strong>{formatCurrency(product.price * quantity)}</strong></div>
          {error && <p className="form-notice" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button className="button" type="submit" disabled={isSaving}>{isSaving ? 'Procesando...' : 'Confirmar pedido'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProductCard({ product, onOrder }) {
  return (
    <article className="market-product-card">
      <div className="market-product-art">
        <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
        <span aria-hidden="true">▤</span><small>{product.category}</small>
      </div>
      <div className="market-product-body">
        <div className="market-shop-name"><span className="market-shop-dot" />{product.shopName}</div>
        <h2>{product.name}</h2>
        {product.sku && <p className="market-product-sku">Código: {product.sku}</p>}
        <div className="market-product-footer">
          <span><strong>{formatCurrency(product.price)}</strong><small>{product.stock} disponibles</small></span>
          <button className="button" type="button" onClick={() => onOrder(product)}>Pedir <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </article>
  )
}

export default function CustomerCatalogPage({ user }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [visualResults, setVisualResults] = useState([])
  const [isSearchingByImage, setIsSearchingByImage] = useState(false)
  const [visualError, setVisualError] = useState('')

  useEffect(() => {
    let active = true
    getPublicCatalogProducts()
      .then((catalog) => { if (active) setProducts(catalog) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.') })
      .finally(() => { if (active) setIsLoading(false) })

    return () => { active = false }
  }, [])

  const categories = useMemo(
    () => ['Todas', ...new Set(products.map((product) => product.category))],
    [products],
  )
  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es')
    return products.filter((product) => {
      const matchesCategory = category === 'Todas' || product.category === category
      const matchesImage = !visualResults.length
        || visualResults.some((result) => result.productId === product.id)
      const matchesSearch = !normalizedSearch
        || `${product.name} ${product.category} ${product.sku} ${product.shopName}`
          .toLocaleLowerCase('es')
          .includes(normalizedSearch)
      return matchesCategory && matchesSearch && matchesImage
    })
  }, [category, products, search, visualResults])

  async function handleVisualSearch(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setVisualError('')
    setVisualResults([])
    setIsSearchingByImage(true)
    try {
      const { findProductsByImage } = await import('../services/productImageModel')
      const predictions = await findProductsByImage(file)
      const availableMatches = predictions
        .map((prediction) => ({
          ...prediction,
          product: products.find((product) => product.id === prediction.productId),
        }))
        .filter((prediction) => prediction.product)
      if (!availableMatches.length) {
        setVisualError('No se encontraron coincidencias entre el modelo y los productos disponibles.')
        return
      }
      setVisualResults(availableMatches)
      setSearch('')
      setCategory('Todas')
    } catch (error) {
      setVisualError(error instanceof Error ? error.message : 'No se pudo buscar con esa imagen.')
    } finally {
      setIsSearchingByImage(false)
    }
  }

  async function handleOrder(details) {
    setIsSaving(true)
    try {
      const order = await createCustomerOrder(user.email, details)
      setProducts((currentProducts) => currentProducts
        .map((product) => product.id === order.productId
          ? { ...product, stock: product.stock - order.quantity }
          : product)
        .filter((product) => product.stock > 0))
      setSelectedProduct(null)
      setMessage(`Pedido recibido por ${order.shopName}. Puedes consultar su estado en “Mis pedidos”.`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="dashboard-welcome customer-catalog-welcome">
        <div><p className="eyebrow">FERRETERÍAS ALIADAS</p><h1>Encuentra tus materiales</h1><p>Busca productos, compara precios y realiza tu pedido.</p></div>
      </div>
      <section className="marketplace-toolbar" aria-label="Filtros de productos">
        <label className="market-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar materiales, herramientas..." aria-label="Buscar productos" />
        </label>
        <label className="visual-search-button">
          <span aria-hidden="true">▧</span>
          {isSearchingByImage ? 'Analizando...' : 'Buscar por foto'}
          <input type="file" accept="image/*" onChange={handleVisualSearch} disabled={isSearchingByImage} aria-label="Buscar productos con una imagen" />
        </label>
        <label className="market-category-label" htmlFor="market-category">Categoría</label>
        <select id="market-category" className="market-category" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((option) => <option key={option}>{option}</option>)}
        </select>
        <span className="market-result-count">{visibleProducts.length} productos</span>
      </section>
      {visualError && <div className="dashboard-feedback backup-error" role="alert"><span>!</span>{visualError}</div>}
      {visualResults.length > 0 && (
        <section className="visual-search-results" aria-label="Coincidencias de búsqueda visual">
          <div className="visual-search-heading">
            <div><strong>Coincidencias visuales</strong><span>Selecciona un producto para ver sus opciones disponibles.</span></div>
            <button type="button" className="text-button" onClick={() => setVisualResults([])}>Mostrar todo</button>
          </div>
          <div className="visual-search-candidates">
            {visualResults.map(({ productId, confidence, product }) => (
              <button
                type="button"
                key={productId}
                className="visual-search-candidate"
                onClick={() => {
                  setVisualResults([{ productId, product, confidence }])
                  setSearch('')
                }}
              >
                <strong>{product.name}</strong><span>{product.shopName}</span>
                <small>{Math.round(confidence * 100)}% coincidencia</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {message && <div className="dashboard-feedback" role="status"><span>✓</span>{message}<button type="button" onClick={() => setMessage('')} aria-label="Cerrar aviso">×</button></div>}
      {isLoading
        ? <div className="market-empty"><span className="market-loader" /><p>Cargando productos...</p></div>
        : visibleProducts.length
          ? <div className="market-product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onOrder={setSelectedProduct} />)}</div>
          : <div className="market-empty"><span>⌕</span><h2>{products.length ? 'No encontramos productos' : 'Aún no hay productos publicados'}</h2><p>{products.length ? 'Prueba con otro nombre o categoría.' : 'Las ferreterías aliadas aparecerán aquí cuando publiquen su catálogo.'}</p></div>}
      {selectedProduct && (
        <OrderDialog
          product={selectedProduct}
          customerName={user.name}
          onClose={() => setSelectedProduct(null)}
          onSubmit={handleOrder}
          isSaving={isSaving}
        />
      )}
    </>
  )
}
