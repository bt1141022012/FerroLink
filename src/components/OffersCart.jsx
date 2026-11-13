import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'
import { DEFAULT_PRODUCT_IMAGE } from './ProductsPage'

function CartLine({ item, onChangeQuantity, onRemove }) {
  const { product, quantity } = item

  return (
    <article className="offers-cart-item">
      <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt="" />
      <div className="offers-cart-item-details">
        <strong>{product.name}</strong>
        <small>{product.shopName}</small>
        <small>{formatCurrency(product.offerPrice)} cada uno</small>
        <div className="offers-cart-quantity">
          <button
            type="button"
            onClick={() => onChangeQuantity(product.id, quantity - 1)}
            disabled={quantity <= 1}
            aria-label={`Reducir cantidad de ${product.name}`}
          >
            −
          </button>
          <span aria-label={`Cantidad: ${quantity}`}>{quantity}</span>
          <button
            type="button"
            onClick={() => onChangeQuantity(product.id, quantity + 1)}
            disabled={quantity >= product.stock}
            aria-label={`Aumentar cantidad de ${product.name}`}
          >
            +
          </button>
        </div>
      </div>
      <div className="offers-cart-item-total">
        <strong>{formatCurrency(product.offerPrice * quantity)}</strong>
        <button className="offers-cart-remove" type="button" onClick={() => onRemove(product.id)}>
          Quitar
        </button>
      </div>
    </article>
  )
}

function OffersCartContents({
  cart,
  user,
  onChangeQuantity,
  onRemove,
  onCheckout,
  onLogin,
  onContinue,
  cartNotice,
}) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const total = cart.reduce(
    (sum, item) => sum + item.product.offerPrice * item.quantity,
    0,
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFeedback('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await onCheckout({
        customerName: formData.get('customerName'),
        deliveryAddress: formData.get('deliveryAddress'),
      })
      setFeedback(result.warning
        ? `Pedido realizado. ${result.warning}`
        : `Pedido registrado: ${result.orders.length} ${result.orders.length === 1 ? 'producto' : 'productos'} solicitado${result.orders.length === 1 ? '' : 's'}.`)
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : 'No se pudo completar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {cartNotice && <p className="offers-cart-notice" role="status">{cartNotice}</p>}
      {error && <p className="form-notice" role="alert">{error}</p>}
      {feedback && <p className="offers-cart-success" role="status">{feedback}</p>}
      {cart.length
        ? (
          <>
            <div className="offers-cart-items">
              {cart.map((item) => (
                <CartLine
                  key={item.product.id}
                  item={item}
                  onChangeQuantity={onChangeQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>
            <div className="offers-cart-total">
              <span>Total de ofertas</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            {user
              ? (
                <form className="dashboard-form offers-cart-checkout" onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <label>Nombre para el pedido
                      <input name="customerName" defaultValue={user.name} maxLength={120} required />
                    </label>
                    <label>Dirección de entrega
                      <input
                        name="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        maxLength={180}
                        placeholder="Calle, colonia, municipio"
                        required
                      />
                    </label>
                  </div>
                  <button className="button" type="submit" disabled={isSubmitting || !cart.length}>
                    {isSubmitting ? 'Procesando pedido...' : 'Realizar pedido'}
                  </button>
                </form>
              )
              : (
                <div className="offers-cart-login">
                  <p>Inicia sesión o crea una cuenta de cliente para confirmar el pedido. Tu carrito se conservará.</p>
                  <button className="button" type="button" onClick={onLogin}>Iniciar sesión para pedir</button>
                </div>
              )}
          </>
        )
        : (
          <div className="offers-cart-empty">
            <span aria-hidden="true">▤</span>
            <h3>Tu carrito está vacío</h3>
            <p>Agrega ofertas vigentes y aparecerán aquí.</p>
            {onContinue && <button className="secondary-button" type="button" onClick={onContinue}>Seguir viendo productos</button>}
          </div>
        )}
    </>
  )
}

export default function OffersCart({
  cart,
  user,
  onChangeQuantity,
  onRemove,
  onCheckout,
  onLogin,
  onClose,
  onContinue,
  cartNotice,
  isDialog = false,
}) {
  if (isDialog) {
    return (
      <div className="dialog-backdrop offers-cart-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="dashboard-dialog offers-cart-dialog" role="dialog" aria-modal="true" aria-labelledby="offers-cart-title">
          <div className="dialog-heading">
            <div>
              <p className="eyebrow">PROMOCIONES</p>
              <h2 id="offers-cart-title">Mi carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h2>
            </div>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar carrito">×</button>
          </div>
          <OffersCartContents
            cart={cart}
            user={user}
            onChangeQuantity={onChangeQuantity}
            onRemove={onRemove}
            onCheckout={onCheckout}
            onLogin={onLogin}
            onContinue={onContinue}
            cartNotice={cartNotice}
          />
        </section>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">PROMOCIONES</p><h1>Mi carrito</h1><p>Revisa las ofertas y confirma tu pedido.</p></div>
      </div>
      <section className="dashboard-panel offers-cart-panel">
        <div className="panel-heading">
          <div><h2>Productos seleccionados</h2><p>{cart.reduce((sum, item) => sum + item.quantity, 0)} productos en tu carrito.</p></div>
        </div>
        <OffersCartContents
          cart={cart}
          user={user}
          onChangeQuantity={onChangeQuantity}
          onRemove={onRemove}
          onCheckout={onCheckout}
          onLogin={onLogin}
          onContinue={onContinue}
          cartNotice={cartNotice}
        />
      </section>
    </>
  )
}
