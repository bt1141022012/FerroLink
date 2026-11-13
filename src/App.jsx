import { useCallback, useEffect, useState } from 'react'
import {
  authenticateLocalUser,
  createOrder,
  deleteProduct,
  getOrders,
  getProducts,
  getLocalUserProfile,
  getShopProfile,
  registerLocalUser,
  saveProduct,
  saveShopProfile,
  updateOrderStatus,
} from './services/localAuth'
import ProductsPage from './components/ProductsPage'
import OrdersPage, { OrdersTable } from './components/OrdersPage'
import CustomerCatalogPage from './components/CustomerCatalogPage'
import CustomerOrdersPage from './components/CustomerOrdersPage'
import MerchantBackupPage from './components/MerchantBackupPage'
import { formatCurrency } from './utils/formatters'
import './App.css'

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="13" fill="currentColor" />
      <path
        d="M12 14h10a5 5 0 0 1 0 10h-2m8 2H18a5 5 0 0 1 0-10h2"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M16 20h8" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 10h11m-4.5-4.5 4.5 4.5-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Brand({ light = false }) {
  return (
    <span className={`brand${light ? ' brand-light' : ''}`}>
      <span className="brand-mark"><BrandMark /></span>
      <span>Ferro<span className="brand-accent">Link</span></span>
    </span>
  )
}

function LandingPage({ onLogin }) {
  return (
    <>
      <header className="site-header">
        <a className="brand-link" href="#inicio" aria-label="FerroLink, inicio">
          <Brand />
        </a>
        <nav className="main-nav" aria-label="Navegación principal">
          <a href="#oferta">Qué ofrecemos</a>
          <a href="#para-quien">Para quién</a>
          <a href="#involucrados">Involucrados</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" type="button" onClick={onLogin}>Iniciar sesión</button>
          <button className="button button-small" type="button" onClick={onLogin}>
            Acceder <ArrowIcon />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> CONECTA TU OPERACIÓN</p>
            <h1>Todo en movimiento.<br /><span>Todo conectado.</span></h1>
            <p className="hero-description">
              FerroLink reúne a las personas y procesos de tu operación en un mismo lugar.
              Menos fricción para trabajar, más claridad para avanzar.
            </p>
            <div className="hero-actions">
              <button className="button" type="button" onClick={onLogin}>
                Comenzar ahora <ArrowIcon />
              </button>
              <a className="quiet-link" href="#oferta">Conoce FerroLink <span>↓</span></a>
            </div>
            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">↗</span>
              <span>Una plataforma pensada para mantener tu operación en marcha.</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Ilustración de una operación conectada">
            <div className="art-glow" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-node node-top"><span>FL</span></div>
            <div className="art-node node-left"><span className="node-symbol">↗</span></div>
            <div className="art-node node-right"><span className="node-symbol">⌘</span></div>
            <div className="art-node node-bottom"><span className="node-symbol">✓</span></div>
            <div className="connection-card">
              <div className="connection-heading">
                <span className="connection-icon"><BrandMark /></span>
                <span><strong>FerroLink</strong><small>Todo en un mismo lugar</small></span>
                <span className="live-dot" aria-label="Conectado" />
              </div>
              <div className="connection-divider" />
              <div className="connection-status">
                <span className="status-bars"><i /><i /><i /><i /><i /></span>
                <span><strong>En conexión</strong><small>Equipos y procesos</small></span>
                <span className="status-arrow">↗</span>
              </div>
            </div>
            <span className="art-caption">CADA PARTE, EN SINTONÍA</span>
          </div>
        </section>

        <section className="platform-section" id="oferta">
          <div className="section-intro">
            <p className="eyebrow">QUÉ OFRECE FERROLINK</p>
            <h2>Encuentra lo que necesitas. Recíbelo donde lo necesitas.</h2>
            <p>Conectamos la oferta de ferreterías locales con quienes necesitan materiales y herramientas para avanzar.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <span className="feature-icon feature-icon-blue" aria-hidden="true">◎</span>
              <h3>Busca y compara</h3>
              <p>Consulta productos, precios y disponibilidad de ferreterías locales en un solo lugar.</p>
              <span className="feature-line" />
            </article>
            <article className="feature-card">
              <span className="feature-number">02</span>
              <span className="feature-icon feature-icon-orange" aria-hidden="true">⌁</span>
              <h3>Identifica por foto</h3>
              <p>Usa la búsqueda visual para encontrar piezas y repuestos aunque no conozcas su nombre técnico.</p>
              <span className="feature-line" />
            </article>
            <article className="feature-card">
              <span className="feature-number">03</span>
              <span className="feature-icon feature-icon-green" aria-hidden="true">↗</span>
              <h3>Coordina la entrega</h3>
              <p>Conecta con transporte bajo demanda en moto, pick-up o camión, según tu pedido.</p>
              <span className="feature-line" />
            </article>
          </div>
        </section>

        <section className="audience-section" id="para-quien">
          <div className="section-intro">
            <p className="eyebrow">PARA QUIÉN ES</p>
            <h2>Hecho para quienes construyen, reparan y abastecen.</h2>
            <p>FerroLink acerca materiales y oportunidades a las personas que hacen avanzar cada proyecto.</p>
          </div>
          <div className="audience-grid">
            <article className="audience-card">
              <span className="audience-index">01 / EN OBRA</span>
              <h3>Profesionales de construcción</h3>
              <p>Albañiles, maestros de obra, electricistas, fontaneros e ingenieros que necesitan encontrar materiales sin detener su trabajo.</p>
            </article>
            <article className="audience-card">
              <span className="audience-index">02 / NEGOCIOS</span>
              <h3>Constructoras y ferreterías</h3>
              <p>Empresas constructoras que buscan abastecer sus proyectos y ferreterías locales que quieren mostrar su catálogo y llegar a más clientes.</p>
            </article>
            <article className="audience-card">
              <span className="audience-index">03 / PROYECTOS PROPIOS</span>
              <h3>Personas y propietarios</h3>
              <p>Personas que realizan reparaciones en casa o gestionan proyectos y necesitan comparar opciones para conseguir lo necesario.</p>
            </article>
          </div>
        </section>

        <section className="stakeholder-section" id="involucrados">
          <div className="section-intro">
            <p className="eyebrow">QUIÉNES PARTICIPAN</p>
            <h2>Un ecosistema conectado de principio a fin.</h2>
            <p>Cada participante aporta una parte para que materiales y pedidos lleguen a donde hacen falta.</p>
          </div>
          <div className="stakeholder-list">
            <article className="stakeholder-item">
              <span className="stakeholder-icon stakeholder-icon-blue" aria-hidden="true">⌕</span>
              <div><h3>Clientes y constructores</h3><p>Buscan productos, comparan opciones y realizan pedidos para sus obras o proyectos.</p></div>
              <span className="stakeholder-role">BUSCAN</span>
            </article>
            <article className="stakeholder-item">
              <span className="stakeholder-icon stakeholder-icon-orange" aria-hidden="true">▤</span>
              <div><h3>Ferreterías aliadas</h3><p>Encargados y administradores publican y gestionan productos, precios y pedidos.</p></div>
              <span className="stakeholder-role">OFRECEN</span>
            </article>
            <article className="stakeholder-item">
              <span className="stakeholder-icon stakeholder-icon-green" aria-hidden="true">↗</span>
              <div><h3>Transportistas independientes</h3><p>Conductores de motos, mototaxis, pick-ups y camiones realizan los traslados.</p></div>
              <span className="stakeholder-role">ENTREGAN</span>
            </article>
            <article className="stakeholder-item">
              <span className="stakeholder-icon stakeholder-icon-slate" aria-hidden="true">⚙</span>
              <div><h3>Administradores de la plataforma</h3><p>El equipo de soporte y supervisión acompaña el funcionamiento del sistema.</p></div>
              <span className="stakeholder-role">ACOMPAÑAN</span>
            </article>
          </div>
        </section>

        <section className="cta-section" id="contacto">
          <div>
            <p className="eyebrow">FERROLINK</p>
            <h2>Conecta con una forma más simple de trabajar.</h2>
          </div>
          <button className="button button-light" type="button" onClick={onLogin}>
            Iniciar sesión <ArrowIcon />
          </button>
          <span className="cta-decoration" aria-hidden="true">FL</span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand-link" href="#inicio"><Brand /></a>
        <span>Conectando cada parte de tu operación.</span>
        <span>© {new Date().getFullYear()} FerroLink</span>
      </footer>
    </>
  )
}

function LoginPage({ onBack, onAuthenticated, initialNotice = '' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState(initialNotice)
  const [mode, setMode] = useState('login')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      if (mode === 'register') {
        if (password !== formData.get('confirmPassword')) {
          setNotice('Las contraseñas no coinciden.')
          return
        }

        const profile = await registerLocalUser({
          name: formData.get('name'),
          email,
          password,
          role: formData.get('role'),
        })
        onAuthenticated(profile, formData.has('remember'))
        return
      }

      const profile = await authenticateLocalUser(email, password)
      if (!profile) {
        setNotice('El correo o la contraseña no son correctos.')
        return
      }
      onAuthenticated(profile, formData.has('remember'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo completar el acceso.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <button className="back-link back-link-light" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Volver al inicio
        </button>
        <div className="login-showcase-content">
          <Brand light />
          <p className="eyebrow">TU OPERACIÓN, MÁS CERCA</p>
          <h1>Un solo lugar.<br /><span>Todo conectado.</span></h1>
          <p>Ingresa a FerroLink y continúa donde tu equipo te necesita.</p>
          <div className="showcase-orbit" aria-hidden="true">
            <span className="showcase-ring ring-one" />
            <span className="showcase-ring ring-two" />
            <span className="showcase-ring ring-three" />
            <span className="showcase-core"><BrandMark /></span>
            <span className="showcase-point point-one" />
            <span className="showcase-point point-two" />
            <span className="showcase-point point-three" />
          </div>
        </div>
        <span className="showcase-footer">FERROLINK <span>·</span> CONECTA Y AVANZA</span>
      </section>

      <section className="login-panel">
        <button className="back-link back-link-mobile" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Volver al inicio
        </button>
        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="login-mark"><BrandMark /></span>
            <p className="eyebrow">{mode === 'login' ? 'BIENVENIDO DE NUEVO' : 'ÚNETE A FERROLINK'}</p>
            <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
            <p>{mode === 'login'
              ? 'Ingresa tus datos para acceder a tu cuenta.'
              : 'Completa tus datos para comenzar a usar FerroLink.'}</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label htmlFor="name">Nombre completo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  minLength={2}
                  maxLength={100}
                  required
                />
                <label htmlFor="role">¿Qué tipo de usuario eres?</label>
                <select id="role" name="role" defaultValue="" required>
                  <option value="" disabled>Selecciona tu perfil</option>
                  <option value="customer">Cliente o constructor</option>
                  <option value="merchant">Ferretería aliada</option>
                  <option value="transporter">Transportista</option>
                </select>
              </>
            )}
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              required
            />
            <div className="password-label">
              <label htmlFor="password">Contraseña</label>
              {mode === 'login' && (
                <button type="button" className="forgot-link" onClick={() => setNotice('Contacta al administrador de tu cuenta para restablecer la contraseña.')}>
                  ¿La olvidaste?
                </button>
              )}
            </div>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? 'Ingresa tu contraseña' : 'Crea una contraseña segura'}
                minLength={8}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {mode === 'register' && (
              <>
                <label className="confirm-password-label" htmlFor="confirm-password">Confirmar contraseña</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Vuelve a escribir tu contraseña"
                  minLength={8}
                  required
                />
              </>
            )}
            <label className="remember-option">
              <input type="checkbox" name="remember" />
              <span>Recordar mi sesión</span>
            </label>
            <button className="button login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Procesando...'
                : mode === 'login' ? 'Entrar a FerroLink' : 'Crear cuenta'}
              {!isSubmitting && <ArrowIcon />}
            </button>
            <p className="form-notice" role="status">{notice}</p>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
            {' '}
            <button
              type="button"
              onClick={() => {
                setMode((currentMode) => currentMode === 'login' ? 'register' : 'login')
                setNotice('')
              }}
            >
              {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
        <span className="login-copyright">© {new Date().getFullYear()} FerroLink</span>
      </section>
    </main>
  )
}

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Resumen', icon: '▦' },
  { id: 'products', label: 'Productos', icon: '▤' },
  { id: 'orders', label: 'Pedidos', icon: '⇄' },
  { id: 'shop', label: 'Mi ferretería', icon: '⌂' },
  { id: 'backup', label: 'Respaldos', icon: '⇩' },
]

const ROLE_LABELS = {
  merchant: 'Ferretería aliada',
  customer: 'Cliente o constructor',
  transporter: 'Transportista',
}

const ROLE_TABS = {
  merchant: DASHBOARD_TABS,
  customer: [
    { id: 'overview', label: 'Inicio', icon: '▦' },
    { id: 'catalog', label: 'Buscar productos', icon: '⌕' },
    { id: 'my-orders', label: 'Mis pedidos', icon: '⇄' },
    { id: 'profile', label: 'Mi perfil', icon: '◉' },
  ],
  transporter: [
    { id: 'overview', label: 'Inicio', icon: '▦' },
    { id: 'deliveries', label: 'Entregas disponibles', icon: '↗' },
    { id: 'delivery-history', label: 'Mi historial', icon: '◷' },
    { id: 'profile', label: 'Mi perfil', icon: '◉' },
  ],
}

async function fetchMerchantData(ownerEmail) {
  const [shop, products, orders] = await Promise.all([
    getShopProfile(ownerEmail),
    getProducts(ownerEmail),
    getOrders(ownerEmail),
  ])
  return { shop, products, orders }
}

function MerchantDashboard({ user, onLogout, notice }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [shop, setShop] = useState({ name: '', phone: '', address: '' })
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [feedback, setFeedback] = useState(notice)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchMerchantData(user.email)
      setShop(data.shop)
      setProducts(data.products)
      setOrders(data.orders)
      return true
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo cargar el panel.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user.email])

  useEffect(() => {
    let active = true
    fetchMerchantData(user.email)
      .then((data) => {
        if (!active) return
        setShop(data.shop)
        setProducts(data.products)
        setOrders(data.orders)
      })
      .catch((error) => {
        if (active) setFeedback(error instanceof Error ? error.message : 'No se pudo cargar el panel.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [user.email])

  async function performAction(action, successMessage) {
    setFeedback('')
    setIsSaving(true)
    try {
      await action()
      if (!await loadDashboard()) return false
      setFeedback(successMessage)
      return true
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo completar la operación.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  function handleProductSave(details) {
    return performAction(
      () => saveProduct(user.email, details),
      details.id ? 'Producto actualizado.' : 'Producto agregado al catálogo.',
    )
  }

  async function handleProductDelete(product) {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) return
    await performAction(() => deleteProduct(user.email, product.id), 'Producto eliminado.')
  }

  async function handleProductToggle(product) {
    await performAction(
      () => saveProduct(user.email, { ...product, available: !product.available }),
      product.available ? 'Producto pausado.' : 'Producto disponible en el catálogo.',
    )
  }

  function handleOrderCreate(details) {
    return performAction(
      () => createOrder(user.email, details),
      'Pedido registrado y existencias actualizadas.',
    )
  }

  async function handleOrderStatus(order, status) {
    await performAction(
      () => updateOrderStatus(user.email, order.id, status),
      status === 'Cancelado' ? 'Pedido cancelado; las existencias fueron devueltas.' : 'Estado del pedido actualizado.',
    )
  }

  async function handleShopSave(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await performAction(
      async () => { setShop(await saveShopProfile(user.email, {
        name: formData.get('shopName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
      })) },
      'Datos de la ferretería guardados.',
    )
  }

  const activeProducts = products.filter((product) => product.available)
  const pendingOrders = orders.filter((order) => !['Entregado', 'Cancelado'].includes(order.status))
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)
  const completedSales = orders.filter((order) => order.status === 'Entregado')
    .reduce((sum, order) => sum + order.total, 0)
  const recentOrders = [...orders].slice(0, 5)

  function renderOverview() {
    return (
      <>
        <div className="dashboard-welcome">
          <div><p className="eyebrow">PANEL DE FERRETERÍA</p><h1>Hola, {shop.name || user.name}</h1><p>Administra tu catálogo y mantén tus pedidos al día.</p></div>
          <button className="button" type="button" onClick={() => setActiveTab('products')}>Agregar producto <span className="plus-sign">+</span></button>
        </div>
        {!shop.name && (
          <button className="setup-callout" type="button" onClick={() => setActiveTab('shop')}>
            <span className="setup-callout-icon">⌂</span><span><strong>Completa el perfil de tu ferretería</strong><small>Agrega el nombre y datos de contacto de tu negocio.</small></span><ArrowIcon />
          </button>
        )}
        <div className="metric-grid">
          <article className="metric-card"><span className="metric-icon metric-blue">▤</span><span className="metric-label">Productos activos</span><strong>{activeProducts.length}</strong><small>{products.length} en el catálogo</small></article>
          <article className="metric-card"><span className="metric-icon metric-orange">◷</span><span className="metric-label">Pedidos pendientes</span><strong>{pendingOrders.length}</strong><small>Por preparar o entregar</small></article>
          <article className="metric-card"><span className="metric-icon metric-green">$</span><span className="metric-label">Valor en inventario</span><strong>{formatCurrency(inventoryValue)}</strong><small>Existencias × precio actual</small></article>
          <article className="metric-card"><span className="metric-icon metric-slate">↗</span><span className="metric-label">Ventas entregadas</span><strong>{formatCurrency(completedSales)}</strong><small>{orders.filter((order) => order.status === 'Entregado').length} pedidos completados</small></article>
        </div>
        <section className="dashboard-panel">
          <div className="panel-heading"><div><h2>Pedidos recientes</h2><p>Revisa su estado y continúa con la siguiente etapa.</p></div><button className="plain-link" type="button" onClick={() => setActiveTab('orders')}>Ver todos <ArrowIcon /></button></div>
          {recentOrders.length
            ? <OrdersTable orders={recentOrders} onStatusChange={handleOrderStatus} />
            : <div className="compact-empty">Los pedidos que registres aparecerán aquí.</div>}
        </section>
      </>
    )
  }

  function renderShop() {
    return (
      <>
        <div className="dashboard-welcome"><div><p className="eyebrow">NEGOCIO</p><h1>Mi ferretería</h1><p>Los datos de contacto que verán tus clientes.</p></div></div>
        <section className="dashboard-panel shop-settings-panel">
          <div className="panel-heading"><div><h2>Información del negocio</h2><p>Mantén los datos de tu ferretería actualizados.</p></div></div>
          <form className="dashboard-form settings-form" onSubmit={handleShopSave}>
            <label>Nombre de la ferretería<input name="shopName" defaultValue={shop.name} key={shop.name} maxLength={120} placeholder="Ej. Ferretería Central" required /></label>
            <div className="form-grid">
              <label>Teléfono de contacto<input name="phone" defaultValue={shop.phone} key={shop.phone} maxLength={40} type="tel" placeholder="0000-0000" /></label>
              <label>Dirección<input name="address" defaultValue={shop.address} key={shop.address} maxLength={180} placeholder="Dirección del negocio" /></label>
            </div>
            <div><button className="button" type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</button></div>
          </form>
        </section>
      </>
    )
  }

  function renderBackup() {
    return <MerchantBackupPage user={user} onRestored={loadDashboard} />
  }

  return (
    <main className="merchant-app">
      <aside className="dashboard-sidebar">
        <a className="brand-link dashboard-brand" href="#panel"><Brand /></a>
        <div className="sidebar-caption">GESTIÓN</div>
        <nav className="dashboard-nav" aria-label="Panel de ferretería">
          {ROLE_TABS.merchant.map((tab) => (
            <button className={activeTab === tab.id ? 'dashboard-nav-item selected' : 'dashboard-nav-item'} type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}>
              <span className="nav-icon" aria-hidden="true">{tab.icon}</span>{tab.label}
              {tab.id === 'orders' && pendingOrders.length > 0 && <span className="nav-counter">{pendingOrders.length}</span>}
            </button>
          ))}
          <button className="dashboard-nav-item dashboard-nav-logout" type="button" onClick={onLogout}>
            <span className="nav-icon" aria-hidden="true">↗</span>Cerrar sesión
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-avatar">{(shop.name || user.name).slice(0, 1).toUpperCase()}</span>
          <span className="sidebar-user"><strong>{shop.name || user.name}</strong><small>{user.email}</small></span>
          <button className="sidebar-logout" type="button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">↗</button>
        </div>
      </aside>
      <section className="dashboard-main" id="panel">
        <header className="dashboard-topbar"><div className="dashboard-breadcrumb">FerroLink <span>/</span> {DASHBOARD_TABS.find((tab) => tab.id === activeTab)?.label}</div><div className="topbar-profile"><span className="online-indicator" /> Sesión activa</div></header>
        <div className="dashboard-content">
          {feedback && <div className={`dashboard-feedback${feedback === notice ? ' feedback-info' : ''}`} role="status"><span>{feedback === notice ? 'i' : '✓'}</span>{feedback}<button type="button" onClick={() => setFeedback('')} aria-label="Cerrar aviso">×</button></div>}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'products' && <ProductsPage
            products={products}
            onSaveProduct={handleProductSave}
            onDeleteProduct={handleProductDelete}
            onToggleAvailability={handleProductToggle}
            isLoading={isLoading}
            isSaving={isSaving}
          />}
          {activeTab === 'orders' && <OrdersPage
            orders={orders}
            products={products}
            onCreateOrder={handleOrderCreate}
            onStatusChange={handleOrderStatus}
            isLoading={isLoading}
            isSaving={isSaving}
          />}
          {activeTab === 'shop' && renderShop()}
          {activeTab === 'backup' && renderBackup()}
        </div>
      </section>
    </main>
  )
}

function RoleDashboard({ user, onLogout, notice }) {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = ROLE_TABS[user.role]
  const selectedTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const roleContent = {
    customer: {
      eyebrow: 'TU ESPACIO DE CONSTRUCCIÓN',
      title: 'Encuentra lo que necesitas para tu proyecto.',
      description: 'Consulta la oferta de ferreterías y mantén tus compras organizadas.',
      cards: [
        ['catalog', '⌕', 'Busca materiales', 'Explora productos disponibles en las ferreterías aliadas.'],
        ['my-orders', '⇄', 'Sigue tus pedidos', 'Consulta el avance de tus compras y entregas.'],
        ['profile', '⌂', 'Organiza tus proyectos', 'Mantén tus datos a mano para futuras compras.'],
      ],
      sections: {
        catalog: ['Catálogo de ferreterías', 'Aquí podrás buscar materiales, comparar opciones y consultar disponibilidad.'],
        'my-orders': ['Mis pedidos', 'Aquí podrás consultar tus pedidos y el avance de cada entrega.'],
      },
    },
    transporter: {
      eyebrow: 'TU ESPACIO DE TRANSPORTE',
      title: 'Conecta con nuevas oportunidades de entrega.',
      description: 'Organiza tus entregas y mantén a la mano la información de cada recorrido.',
      cards: [
        ['deliveries', '↗', 'Encuentra entregas', 'Consulta solicitudes de transporte de ferreterías aliadas.'],
        ['delivery-history', '◷', 'Actualiza recorridos', 'Mantén al día las etapas de preparación y entrega.'],
        ['profile', '⌂', 'Gestiona tu perfil', 'Ten visibles tus datos de contacto para coordinar.'],
      ],
      sections: {
        deliveries: ['Entregas disponibles', 'Aquí aparecerán las solicitudes de transporte de las ferreterías.'],
        'delivery-history': ['Historial de entregas', 'Aquí podrás consultar las entregas completadas y su estado.'],
      },
    },
  }[user.role]

  function renderRoleContent() {
    if (user.role === 'customer' && activeTab === 'catalog') {
      return <CustomerCatalogPage user={user} />
    }

    if (user.role === 'customer' && activeTab === 'my-orders') {
      return <CustomerOrdersPage user={user} />
    }

    if (activeTab === 'profile') {
      return (
        <section className="dashboard-panel role-profile-panel">
          <div className="panel-heading"><div><h2>Datos de la cuenta</h2><p>Información asociada a tu perfil.</p></div></div>
          <div className="role-profile-details">
            <div><span>Nombre</span><strong>{user.name}</strong></div>
            <div><span>Correo electrónico</span><strong>{user.email}</strong></div>
            <div><span>Tipo de usuario</span><strong>{ROLE_LABELS[user.role]}</strong></div>
          </div>
        </section>
      )
    }

    if (activeTab !== 'overview') {
      const [title, description] = roleContent.sections[activeTab]
      return (
        <section className="dashboard-panel role-module-panel">
          <div className="role-module-icon">{selectedTab.icon}</div>
          <p className="eyebrow">{ROLE_LABELS[user.role]}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      )
    }

    return (
      <>
        <div className="dashboard-welcome role-welcome">
          <div><p className="eyebrow">{roleContent.eyebrow}</p><h1>{user.name}</h1><p>{roleContent.description}</p></div>
        </div>
        <section className="role-hero-card">
          <div className="role-hero-icon">{user.role === 'customer' ? '⌕' : '↗'}</div>
          <p className="eyebrow">FERROLINK</p>
          <h2>{roleContent.title}</h2>
          <p>{roleContent.description}</p>
        </section>
        <div className="role-feature-grid">
          {roleContent.cards.map(([tabId, icon, title, description]) => (
            <button
              className="role-feature-card"
              type="button"
              key={title}
              onClick={() => setActiveTab(tabId)}
            >
              <span>{icon}</span><strong>{title}</strong><small>{description}</small>
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <main className="merchant-app role-app">
      <aside className="dashboard-sidebar">
        <a className="brand-link dashboard-brand" href="#panel"><Brand /></a>
        <div className="sidebar-caption">MI FERROLINK</div>
        <nav className="dashboard-nav" aria-label={`Menú para ${ROLE_LABELS[user.role]}`}>
          {tabs.map((tab) => (
            <button className={activeTab === tab.id ? 'dashboard-nav-item selected' : 'dashboard-nav-item'} type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}>
              <span className="nav-icon" aria-hidden="true">{tab.icon}</span>{tab.label}
            </button>
          ))}
          <button className="dashboard-nav-item dashboard-nav-logout" type="button" onClick={onLogout}>
            <span className="nav-icon" aria-hidden="true">↗</span>Cerrar sesión
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="sidebar-user"><strong>{user.name}</strong><small>{ROLE_LABELS[user.role]}</small></span>
          <button className="sidebar-logout" type="button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">↗</button>
        </div>
      </aside>
      <section className="dashboard-main" id="panel">
        <header className="dashboard-topbar"><div className="dashboard-breadcrumb">FerroLink <span>/</span> {selectedTab.label}</div><div className="topbar-profile"><span className="online-indicator" /> Sesión activa</div></header>
        <div className="dashboard-content">
          {notice && <div className="dashboard-feedback feedback-info" role="status"><span>i</span>{notice}</div>}
          {renderRoleContent()}
        </div>
      </section>
    </main>
  )
}

function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)
  const [sessionNotice, setSessionNotice] = useState('')

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const savedSession = localStorage.getItem('ferrolink-session')
          ?? sessionStorage.getItem('ferrolink-session')
        if (!savedSession) return

        const { email } = JSON.parse(savedSession)
        if (typeof email !== 'string') throw new Error('La sesión guardada no es válida.')

        const profile = await getLocalUserProfile(email)
        if (!profile) {
          localStorage.removeItem('ferrolink-session')
          sessionStorage.removeItem('ferrolink-session')
          return
        }

        if (active) setUser(profile)
      } catch {
        if (active) {
          setPage('login')
          setSessionNotice('No se pudo restaurar tu sesión. Inicia sesión nuevamente.')
        }
      }
    }

    restoreSession()
    return () => { active = false }
  }, [])

  async function handleAuthenticated(profile, remember) {
    localStorage.removeItem('ferrolink-session')
    sessionStorage.removeItem('ferrolink-session')
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('ferrolink-session', JSON.stringify({ email: profile.email }))
    setSessionNotice('')
    setUser(profile)
  }

  function handleLogout() {
    try {
      localStorage.removeItem('ferrolink-session')
      sessionStorage.removeItem('ferrolink-session')
      setUser(null)
      setPage('landing')
    } catch {
      setSessionNotice('No se pudo borrar la sesión guardada. Intenta cerrar sesión nuevamente.')
    }
  }

  if (user) {
    const role = ['merchant', 'customer', 'transporter'].includes(user.role) ? user.role : 'merchant'
    const account = { ...user, role }
    return role === 'merchant'
      ? <MerchantDashboard user={account} onLogout={handleLogout} notice={sessionNotice} />
      : <RoleDashboard user={account} onLogout={handleLogout} notice={sessionNotice} />
  }

  return page === 'login'
    ? <LoginPage
      onBack={() => setPage('landing')}
      onAuthenticated={handleAuthenticated}
      initialNotice={sessionNotice}
    />
    : <LandingPage onLogin={() => setPage('login')} />
}

export default App
