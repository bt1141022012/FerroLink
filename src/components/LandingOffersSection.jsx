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

function OfferCard({ product, onLogin }) {
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
          <button className="button" type="button" onClick={onLogin}>Ver oferta <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </article>
  )
}

export default function LandingOffersSection({ onLogin }) {
  const [offers, setOffers] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
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
                <div className="market-product-grid landing-offers-grid">
                  {visibleOffers.map((product) => (
                    <OfferCard key={product.id} product={product} onLogin={onLogin} />
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
    </section>
  )
}
