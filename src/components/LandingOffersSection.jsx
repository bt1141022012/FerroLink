import { useEffect, useState } from 'react'
import { getActiveOffers } from '../services/localAuth'
import { formatCurrency } from '../utils/formatters'
import { DEFAULT_PRODUCT_IMAGE } from './ProductsPage'

const OFFERS_PER_PAGE = 6

function formatOfferDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function OfferCard({ product, cartQuantity, onAddToCart, onShowDetails }) {
  return (
    <article className="market-product-card landing-offer-card">
      <div className="market-product-art">
        <img
          src={product.image || DEFAULT_PRODUCT_IMAGE}
          alt={product.name}
          loading="lazy"
          onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}
        />
        <span aria-hidden="true">▤</span>
        <small>{product.category}</small>
        <strong className="offer-ribbon">Oferta</strong>
      </div>
      <div className="market-product-body">
        <div className="market-shop-name"><span className="market-shop-dot" />{product.shopName}</div>
        <h2>{product.name}</h2>
        <p className="landing-offer-description">{product.offerDescription}</p>
        <div className="landing-offer-dates">
          Del {formatOfferDate(product.offerStartDate)} al {formatOfferDate(product.offerEndDate)}
        </div>
        <div className="market-product-footer">
          <span>
            <strong>{formatCurrency(product.offerPrice)}</strong>
            {product.offerPrice !== product.price && <small className="offer-regular-price">Precio regular: {formatCurrency(product.price)}</small>}
            <small>{product.stock} disponibles</small>
          </span>
          <div className="landing-offer-actions">
            <button className="secondary-button" type="button" onClick={() => onShowDetails(product)}>Ver detalles</button>
            <button
              className="button"
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={cartQuantity >= product.stock}
            >
              {cartQuantity ? `Agregar otra (${cartQuantity})` : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function OfferDetailsDialog({ product, onClose, onAddToCart, cartQuantity }) {
  if (!product) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dashboard-dialog offer-details-dialog" role="dialog" aria-modal="true" aria-labelledby="offer-details-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">OFERTA VIGENTE</p><h2 id="offer-details-title">{product.name}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalles">×</button>
        </div>
        <img className="offer-details-image" src={product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} />
        <p className="market-shop-name"><span className="market-shop-dot" />{product.shopName}</p>
        <p className="offer-details-description">{product.offerDescription}</p>
        <p className="landing-offer-dates">Vigencia: del {formatOfferDate(product.offerStartDate)} al {formatOfferDate(product.offerEndDate)}</p>
        <div className="offer-details-price">
          <strong>{formatCurrency(product.offerPrice)}</strong>
          {product.offerPrice !== product.price && <span>Precio regular: {formatCurrency(product.price)}</span>}
        </div>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Seguir viendo</button>
          <button
            className="button"
            type="button"
            onClick={() => { onAddToCart(product); onClose() }}
            disabled={cartQuantity >= product.stock}
          >
            {cartQuantity ? `Agregar otra (${cartQuantity} en carrito)` : 'Agregar al carrito'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default function LandingOffersSection({ onAddToCart, cart, cartNotice }) {
  const [offers, setOffers] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    getActiveOffers()
      .then((activeOffers) => {
        if (active) setOffers(activeOffers)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las ofertas vigentes.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  const pageCount = Math.ceil(offers.length / OFFERS_PER_PAGE)
  const visibleOffers = offers.slice(
    currentPage * OFFERS_PER_PAGE,
    (currentPage + 1) * OFFERS_PER_PAGE,
  )

  return (
    <section className="landing-offers-section" id="ofertas">
      <div className="section-intro">
        <p className="eyebrow">PROMOCIONES VIGENTES</p>
        <h2>Ofertas para tus proyectos.</h2>
        <p>Encuentra productos en oferta durante las fechas definidas por las ferreterías aliadas.</p>
      </div>
      {isLoading
        ? <p className="landing-offers-message" role="status">Cargando ofertas...</p>
        : error
          ? <p className="landing-offers-message landing-offers-error" role="alert">{error}</p>
          : visibleOffers.length
            ? (
              <>
                {cartNotice && <p className="landing-offers-notice" role="status">{cartNotice}</p>}
                <div className="market-product-grid landing-offers-grid">
                  {visibleOffers.map((product) => (
                    <OfferCard
                      key={product.id}
                      product={product}
                      cartQuantity={cart.find((item) => item.product.id === product.id)?.quantity ?? 0}
                      onAddToCart={onAddToCart}
                      onShowDetails={setSelectedOffer}
                    />
                  ))}
                </div>
                <div className="landing-offers-pagination">
                  <span aria-live="polite">
                    Página {currentPage + 1} de {pageCount} · {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  {pageCount > 1 && (
                    <div>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setCurrentPage((page) => page - 1)}
                        disabled={currentPage === 0}
                        aria-label="Ver ofertas anteriores"
                      >
                        Anterior
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setCurrentPage((page) => page + 1)}
                        disabled={currentPage >= pageCount - 1}
                        aria-label="Ver más ofertas"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              </>
            )
            : <p className="landing-offers-message">No hay ofertas vigentes en este momento. Vuelve pronto para ver nuevas promociones.</p>}
      <OfferDetailsDialog
        product={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onAddToCart={onAddToCart}
        cartQuantity={cart.find((item) => item.product.id === selectedOffer?.id)?.quantity ?? 0}
      />
    </section>
  )
}
