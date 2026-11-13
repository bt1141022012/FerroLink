import { useEffect, useState } from 'react'
import {
  authenticateLocalUser,
  getLocalUserProfile,
  registerLocalUser,
} from './services/localAuth'
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

function AccountPage({ user, onLogout, notice }) {
  return (
    <main className="account-page">
      <header className="account-header">
        <a className="brand-link" href="#inicio"><Brand /></a>
        <button className="text-button" type="button" onClick={onLogout}>Cerrar sesión</button>
      </header>
      <section className="account-card">
        <span className="login-mark"><BrandMark /></span>
        <p className="eyebrow">FERROLINK</p>
        <h1>¡Hola, {user.name}!</h1>
        <p>Tu sesión está activa. Ya puedes continuar con FerroLink.</p>
        <div className="account-email">{user.email}</div>
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <button className="button" type="button" onClick={onLogout}>Cerrar sesión <ArrowIcon /></button>
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

  if (user) return <AccountPage user={user} onLogout={handleLogout} notice={sessionNotice} />

  return page === 'login'
    ? <LoginPage
      onBack={() => setPage('landing')}
      onAuthenticated={handleAuthenticated}
      initialNotice={sessionNotice}
    />
    : <LandingPage onLogin={() => setPage('login')} />
}

export default App
