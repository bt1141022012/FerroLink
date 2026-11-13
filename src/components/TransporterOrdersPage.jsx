import { useEffect, useState } from 'react'
import { getTransporterOrders, updateTransporterOrderStatus } from '../services/localAuth'
import { formatCurrency, formatDate } from '../utils/formatters'

const DELIVERY_STATUS_TRANSITIONS = {
  'Pendiente de aceptación': ['Aceptado', 'No aceptado'],
  Aceptado: ['En camino'],
  'En camino': ['Entregado'],
  Entregado: [],
  'No aceptado': [],
  Cancelado: [],
}

export default function TransporterOrdersPage({ user, history = false }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [savingOrderId, setSavingOrderId] = useState('')

  useEffect(() => {
    let active = true
    getTransporterOrders(user.email)
      .then((assignedOrders) => {
        if (active) setOrders(assignedOrders)
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error
          ? error.message
          : 'No se pudieron cargar los pedidos asignados.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [user.email])

  const visibleOrders = orders.filter((order) => {
    const deliveryStatus = order.deliveryStatus || 'Pendiente de aceptación'
    const isFinished = ['Entregado', 'No aceptado', 'Cancelado'].includes(deliveryStatus)
      || ['Entregado', 'Cancelado'].includes(order.status)
    return history ? isFinished : !isFinished
  })

  async function handleDeliveryStatusChange(order, status) {
    setSavingOrderId(order.id)
    setMessage('')
    try {
      const updatedOrder = await updateTransporterOrderStatus(user.email, order.id, status)
      setOrders((currentOrders) => currentOrders.map((currentOrder) => currentOrder.id === order.id
        ? updatedOrder
        : currentOrder))
      setMessage(status === 'Aceptado'
        ? 'Aceptaste llevar este pedido.'
        : status === 'No aceptado'
          ? 'Rechazaste la solicitud de entrega.'
          : status === 'En camino'
            ? 'El pedido está marcado como en camino.'
            : 'El pedido se marcó como entregado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el estado de la entrega.')
    } finally {
      setSavingOrderId('')
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">MIS ENTREGAS</p>
          <h1>{history ? 'Historial de entregas' : 'Pedidos asignados'}</h1>
          <p>{history
            ? 'Consulta los pedidos finalizados que fueron asignados a tu cuenta.'
            : 'Consulta los pedidos que las ferreterías te han asignado para entrega.'}</p>
        </div>
      </div>
      {message && <div className="dashboard-feedback feedback-info" role="status"><span>i</span>{message}</div>}
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>{history ? 'Entregas finalizadas' : 'Entregas pendientes'} <span className="count-badge">{visibleOrders.length}</span></h2>
            <p>Las asignaciones las administra cada ferretería.</p>
          </div>
        </div>
        {isLoading
          ? <div className="compact-empty">Cargando pedidos asignados...</div>
          : visibleOrders.length
            ? (
              <div className="table-scroll">
                <table className="data-table orders-table transporter-orders-table">
                  <thead><tr><th>Pedido</th><th>Ferretería</th><th>Cliente y dirección</th><th>Producto</th><th>Total</th><th>Fecha</th><th>Entrega</th><th>Pedido</th></tr></thead>
                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>#{order.id.slice(0, 6).toUpperCase()}</strong></td>
                        <td>{order.shopName || 'Ferretería aliada'}</td>
                        <td>{order.customerName}{order.deliveryAddress && <small>{order.deliveryAddress}</small>}</td>
                        <td>{order.productName}<small>{order.quantity} × {formatCurrency(order.unitPrice)}</small></td>
                        <td className="table-emphasis">{formatCurrency(order.total)}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          {history
                            ? <span className={`customer-order-status order-status-${(order.deliveryStatus || order.status).toLowerCase().replaceAll(' ', '-')}`}>{order.deliveryStatus || order.status}</span>
                            : (
                              <select
                                className={`order-status-select order-status-${(order.deliveryStatus || 'Pendiente de aceptación').toLowerCase().replaceAll(' ', '-')}`}
                                value={order.deliveryStatus || 'Pendiente de aceptación'}
                                onChange={(event) => handleDeliveryStatusChange(order, event.target.value)}
                                disabled={savingOrderId === order.id || !DELIVERY_STATUS_TRANSITIONS[order.deliveryStatus || 'Pendiente de aceptación']?.length}
                                aria-label={`Estado de entrega del pedido ${order.id.slice(0, 6)}`}
                              >
                                <option value={order.deliveryStatus || 'Pendiente de aceptación'}>{order.deliveryStatus || 'Pendiente de aceptación'}</option>
                                {DELIVERY_STATUS_TRANSITIONS[order.deliveryStatus || 'Pendiente de aceptación']?.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            )}
                        </td>
                        <td><span className={`customer-order-status order-status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            : <div className="compact-empty">{history
              ? 'Todavía no tienes pedidos finalizados asignados.'
              : 'No tienes pedidos asignados en este momento.'}</div>}
      </section>
    </>
  )
}
