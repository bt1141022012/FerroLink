import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/formatters'

const ORDER_STATUSES = ['Recibido', 'Preparando', 'En camino', 'Entregado', 'Cancelado']

function getNextOrderStatuses(status) {
  const transitions = {
    Recibido: ['Preparando', 'Cancelado'],
    Preparando: ['En camino', 'Cancelado'],
    'En camino': ['Entregado', 'Cancelado'],
    Entregado: [],
    Cancelado: [],
  }
  return transitions[status] ?? []
}

function OrderDialog({ products, onClose, onSave, isSaving }) {
  const availableProducts = products.filter((product) => product.available && product.stock > 0)

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await onSave({
      customerName: formData.get('customerName'),
      productId: formData.get('productId'),
      quantity: formData.get('quantity'),
      deliveryAddress: formData.get('deliveryAddress'),
    })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">VENTA</p>
            <h2 id="order-dialog-title">Registrar pedido</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {availableProducts.length === 0
          ? <p className="empty-note">Agrega productos disponibles con existencias antes de registrar un pedido.</p>
          : (
            <form className="dashboard-form" onSubmit={handleSubmit}>
              <label>Nombre del cliente<input name="customerName" maxLength={120} placeholder="Nombre del cliente" required /></label>
              <label>Producto
                <select name="productId" required>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {formatCurrency(product.price)} · {product.stock} disponibles
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>Cantidad<input name="quantity" type="number" min="1" step="1" defaultValue="1" required /></label>
                <label>Dirección de entrega <span className="optional-label">Opcional</span><input name="deliveryAddress" maxLength={180} placeholder="Dirección de entrega" /></label>
              </div>
              <p className="inventory-note">Al registrar el pedido, las unidades se descuentan del inventario.</p>
              <div className="dialog-actions">
                <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
                <button className="button" type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Registrar pedido'}</button>
              </div>
            </form>
          )}
      </section>
    </div>
  )
}

export function OrdersTable({
  orders,
  allOrders = orders,
  busyTransporterEmails = [],
  onStatusChange,
  transporters = [],
  onTransporterChange,
}) {
  if (!orders.length) {
    return <div className="dashboard-empty"><span>⇄</span><h3>Aún no hay pedidos</h3><p>Registra un pedido para dar seguimiento a su preparación y entrega.</p></div>
  }

  const occupiedTransporterEmails = new Set([
    ...busyTransporterEmails,
    ...allOrders
    .filter((candidate) => !['Entregado', 'Cancelado'].includes(candidate.status)
      && !['Entregado', 'No aceptado', 'Cancelado'].includes(candidate.deliveryStatus))
    .map((candidate) => candidate.transporterEmail)
    .filter(Boolean),
  ])

  return (
    <div className="table-scroll">
      <table className="data-table orders-table">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Fecha</th><th>Estado</th>{onTransporterChange && <><th>Entrega</th><th>Camionero</th></>}</tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><strong>#{order.id.slice(0, 6).toUpperCase()}</strong></td>
              <td>{order.customerName}{order.deliveryAddress && <small>{order.deliveryAddress}</small>}</td>
              <td>{order.productName}<small>{order.quantity} × {formatCurrency(order.unitPrice)}</small></td>
              <td className="table-emphasis">{formatCurrency(order.total)}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <select
                  className={`order-status-select order-status-${order.status.toLowerCase().replaceAll(' ', '-')}`}
                  value={order.status}
                  onChange={(event) => onStatusChange(order, event.target.value)}
                  disabled={order.status === 'Cancelado'}
                  aria-label={`Estado del pedido ${order.id.slice(0, 6)}`}
                >
                  {ORDER_STATUSES
                    .filter((status) => status === order.status || getNextOrderStatuses(order.status).includes(status))
                    .map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              {onTransporterChange && (
                <>
                  <td>{order.transporterEmail
                    ? <span className={`customer-order-status order-status-${(order.deliveryStatus || 'Pendiente de aceptación').toLowerCase().replaceAll(' ', '-')}`}>{order.deliveryStatus || 'Pendiente de aceptación'}</span>
                    : '—'}</td>
                  <td>
                    <select
                      className="order-transporter-select"
                      value={order.transporterEmail ?? ''}
                      onChange={(event) => onTransporterChange(order, event.target.value)}
                      disabled={['Entregado', 'Cancelado'].includes(order.status)}
                      aria-label={`Camionero asignado al pedido ${order.id.slice(0, 6)}`}
                    >
                      <option value="">Sin asignar</option>
                      {order.transporterEmail && !transporters.some(
                        (transporter) => transporter.email === order.transporterEmail,
                      ) && (
                        <option value={order.transporterEmail} disabled>
                          {order.transporterName || order.transporterEmail} (ya no asociado)
                        </option>
                      )}
                      {transporters.map((transporter) => (
                        <option
                          key={transporter.email}
                          value={transporter.email}
                          disabled={transporter.email !== order.transporterEmail
                            && occupiedTransporterEmails.has(transporter.email)}
                        >
                          {transporter.name}{transporter.email !== order.transporterEmail
                            && occupiedTransporterEmails.has(transporter.email) ? ' (ocupado)' : ''}
                        </option>
                      ))}
                      {!transporters.length && <option value="" disabled>Asocia un camionero primero</option>}
                    </select>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OrdersPage({
  orders,
  products,
  onCreateOrder,
  onStatusChange,
  transporters,
  busyTransporterEmails,
  onTransporterChange,
  isLoading,
  isSaving,
}) {
  const [showOrderDialog, setShowOrderDialog] = useState(false)

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">VENTAS</p><h1>Gestión de pedidos</h1><p>Registra ventas y actualiza cada etapa de preparación y entrega.</p></div>
        <button className="button" type="button" onClick={() => setShowOrderDialog(true)}>Registrar pedido <span className="plus-sign">+</span></button>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Todos los pedidos <span className="count-badge">{orders.length}</span></h2><p>Al cancelar, las unidades regresan al inventario. {transporters.length ? 'Asigna a uno de tus camioneros asociados; cada uno solo puede tener un pedido abierto.' : 'Asocia camioneros en el menú Camioneros para asignarlos a los pedidos.'}</p></div></div>
        {isLoading
          ? <div className="compact-empty">Cargando pedidos...</div>
          : <OrdersTable
            orders={orders}
            allOrders={orders}
            busyTransporterEmails={busyTransporterEmails}
            onStatusChange={onStatusChange}
            transporters={transporters}
            onTransporterChange={onTransporterChange}
          />}
      </section>
      {showOrderDialog && (
        <OrderDialog
          products={products}
          onClose={() => setShowOrderDialog(false)}
          onSave={async (details) => {
            const saved = await onCreateOrder(details)
            if (saved) setShowOrderDialog(false)
          }}
          isSaving={isSaving}
        />
      )}
    </>
  )
}
