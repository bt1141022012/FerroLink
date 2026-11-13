const DATABASE_NAME = 'ferrolink-local'
const DATABASE_VERSION = 1
const USERS_STORE = 'users'
const PASSWORD_ITERATIONS = 310_000

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('No se pudo acceder al almacenamiento de cuentas. Comprueba el navegador e inténtalo nuevamente.'))
  }

  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    let blocked = false

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(USERS_STORE)) {
        database.createObjectStore(USERS_STORE, { keyPath: 'email' })
      }
    }

    request.onsuccess = () => {
      if (blocked) {
        request.result.close()
        return
      }
      resolve(request.result)
    }
    request.onerror = () => reject(new Error('No se pudieron cargar las cuentas. Inténtalo nuevamente.'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('El almacenamiento está ocupado en otra pestaña. Ciérrala e inténtalo de nuevo.'))
    }
  })
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('No se pudieron guardar los cambios. Inténtalo nuevamente.'))
    transaction.onabort = () => reject(new Error('No se pudo completar la operación. Inténtalo nuevamente.'))
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('No se pudo completar la operación. Inténtalo nuevamente.'))
  })
}

function encodeBytes(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function decodeBytes(encoded) {
  return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
}

async function derivePasswordHash(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Este navegador no ofrece la protección criptográfica requerida.')
  }

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  return new Uint8Array(await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  ))
}

function passwordsMatch(actual, expected) {
  if (actual.length !== expected.length) return false

  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index]
  }
  return difference === 0
}

function toProfile(user) {
  return { name: user.name, email: user.email }
}

export async function registerLocalUser({ name, email, password }) {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw new Error('El nombre debe tener entre 2 y 100 caracteres.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Ingresa un correo electrónico válido.')
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Este navegador no ofrece la protección criptográfica requerida.')
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await derivePasswordHash(password, salt)
  const database = await openDatabase()

  try {
    const transaction = database.transaction(USERS_STORE, 'readwrite')
    const completed = transactionComplete(transaction)
    const request = transaction.objectStore(USERS_STORE).add({
      name: normalizedName,
      email: normalizedEmail,
      passwordSalt: encodeBytes(salt),
      passwordHash: encodeBytes(passwordHash),
      createdAt: new Date().toISOString(),
    })

    try {
      await requestResult(request)
      await completed
    } catch (error) {
      await completed.catch(() => {})
      if (error.name === 'ConstraintError') {
        throw new Error('Ya existe una cuenta con ese correo electrónico.', { cause: error })
      }
      throw error
    }

    return { name: normalizedName, email: normalizedEmail }
  } finally {
    database.close()
  }
}

export async function authenticateLocalUser(email, password) {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(USERS_STORE, 'readonly')
    const completed = transactionComplete(transaction)
    const user = await requestResult(
      transaction.objectStore(USERS_STORE).get(email.trim().toLowerCase()),
    )
    await completed

    if (!user) return null

    const actualHash = await derivePasswordHash(password, decodeBytes(user.passwordSalt))
    const expectedHash = decodeBytes(user.passwordHash)
    return passwordsMatch(actualHash, expectedHash) ? toProfile(user) : null
  } finally {
    database.close()
  }
}

export async function getLocalUserProfile(email) {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(USERS_STORE, 'readonly')
    const completed = transactionComplete(transaction)
    const user = await requestResult(
      transaction.objectStore(USERS_STORE).get(email.trim().toLowerCase()),
    )
    await completed
    return user ? toProfile(user) : null
  } finally {
    database.close()
  }
}
