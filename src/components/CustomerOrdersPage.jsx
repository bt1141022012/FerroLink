import { useEffect, useState } from 'react'
import { getCustomerOrders } from '../services/localAuth'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function CustomerOrdersPage({ user }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    getCustomerOrders(user.email)
      .then((customerOrders) => { if (active) setOrders(customerOrders) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos.') })
      .finally(() => { if (active) setIsLoading(false) })

    return () => { active = false }
  }, [user.email])

  return (
    <>
      <div className="dashboard-welcome">
        <div><p className="eyebrow">COMPRAS</p><h1>Mis pedidos</h1><p>Consulta los productos que solicitaste y el estado de cada pedido.</p></div>
      </div>
      {message && <div className="dashboard-feedback feedback-info" role="status"><span>i</span>{message}</div>}
      <section className="dashboard-panel customer-orders-panel">
        <div className="panel-heading"><div><h2>Historial de pedidos <span className="count-badge">{orders.length}</span></h2><p>El estado se actualiza conforme la ferretería prepara tu pedido.</p></div></div>
        {isLoading
          ? <div className="compact-empty">Cargando tus pedidos...</div>
          : orders.length
            ? (
              <div className="table-scroll">
                <table className="data-table customer-orders-table">
                  <thead><tr><th>Pedido</th><th>Ferretería</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Camionero y entrega</th><th>Fecha</th><th>Estado</th></tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>#{order.id.slice(0, 6).toUpperCase()}</strong></td>
                        <td>{order.shopName || 'Ferretería aliada'}</td>
                        <td><strong>{order.productName}</strong>{order.deliveryAddress && <small>{order.deliveryAddress}</small>}</td>
                        <td>{order.quantity}</td>
                        <td className="table-emphasis">{formatCurrency(order.total)}</td>
                        <td>{order.transporterName || 'Sin asignar'}{order.transporterEmail && <small>{order.deliveryStatus || 'Pendiente de aceptación'}</small>}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td><span className={`customer-order-status order-status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            : <div className="market-empty customer-orders-empty"><span>⇄</span><h2>Todavía no tienes pedidos</h2><p>Explora el catálogo de ferreterías y realiza tu primer pedido.</p></div>}
      </section>
    </>
  )
}
