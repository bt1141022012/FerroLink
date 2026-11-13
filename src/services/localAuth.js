const DATABASE_NAME = 'ferrolink-local'
const DATABASE_VERSION = 3
const USERS_STORE = 'users'
const SHOPS_STORE = 'shops'
const PRODUCTS_STORE = 'products'
const ORDERS_STORE = 'orders'
const PASSWORD_ITERATIONS = 310_000
const BACKUP_FORMAT = 'ferrolink-account-backup'
const BACKUP_VERSION = 1
const MAX_PRODUCT_IMAGE_LENGTH = 1_500_000

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
      if (!database.objectStoreNames.contains(SHOPS_STORE)) {
        database.createObjectStore(SHOPS_STORE, { keyPath: 'ownerEmail' })
      }
      if (!database.objectStoreNames.contains(PRODUCTS_STORE)) {
        const products = database.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' })
        products.createIndex('ownerEmail', 'ownerEmail', { unique: false })
      }
      if (!database.objectStoreNames.contains(ORDERS_STORE)) {
        const orders = database.createObjectStore(ORDERS_STORE, { keyPath: 'id' })
        orders.createIndex('ownerEmail', 'ownerEmail', { unique: false })
        orders.createIndex('customerEmail', 'customerEmail', { unique: false })
      } else {
        const orders = request.transaction.objectStore(ORDERS_STORE)
        if (!orders.indexNames.contains('customerEmail')) {
          orders.createIndex('customerEmail', 'customerEmail', { unique: false })
        }
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
  return { name: user.name, email: user.email, role: user.role ?? 'merchant' }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('No se pudo crear el registro. Comprueba el navegador e inténtalo nuevamente.')
  }
  return encodeBytes(globalThis.crypto.getRandomValues(new Uint8Array(16)))
}

function normalizeText(value, label, maxLength = 120) {
  const text = value.trim()
  if (!text || text.length > maxLength) {
    throw new Error(`${label} es obligatorio y debe tener menos de ${maxLength} caracteres.`)
  }
  return text
}

function validatePrice(value) {
  const price = Number(value)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Ingresa un precio válido mayor o igual a cero.')
  }
  return Math.round(price * 100) / 100
}

function validateStock(value) {
  const stock = Number(value)
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('La existencia debe ser un número entero mayor o igual a cero.')
  }
  return stock
}

function isValidDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function getLocalDateOnly() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

async function getAccountRecords(storeName, ownerEmail) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(storeName, 'readonly')
    const completed = transactionComplete(transaction)
    const records = await requestResult(
      transaction.objectStore(storeName).index('ownerEmail').getAll(ownerEmail),
    )
    await completed
    return records
  } finally {
    database.close()
  }
}

export async function getShopProfile(ownerEmail) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(SHOPS_STORE, 'readonly')
    const completed = transactionComplete(transaction)
    const profile = await requestResult(transaction.objectStore(SHOPS_STORE).get(ownerEmail))
    await completed
    return profile ?? { ownerEmail, name: '', phone: '', address: '' }
  } finally {
    database.close()
  }
}

export async function saveShopProfile(ownerEmail, details) {
  const profile = {
    ownerEmail,
    name: normalizeText(details.name, 'El nombre de la ferretería', 120),
    phone: details.phone.trim().slice(0, 40),
    address: details.address.trim().slice(0, 180),
    updatedAt: new Date().toISOString(),
  }
  const database = await openDatabase()
  try {
    const transaction = database.transaction(SHOPS_STORE, 'readwrite')
    const completed = transactionComplete(transaction)
    await requestResult(transaction.objectStore(SHOPS_STORE).put(profile))
    await completed
    return profile
  } finally {
    database.close()
  }
}

export async function getProducts(ownerEmail) {
  const products = await getAccountRecords(PRODUCTS_STORE, ownerEmail)
  return products.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function exportAccountBackup(ownerEmail) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction([SHOPS_STORE, PRODUCTS_STORE, ORDERS_STORE], 'readonly')
    const completed = transactionComplete(transaction)
    const shopRequest = transaction.objectStore(SHOPS_STORE).get(ownerEmail)
    const productsRequest = transaction.objectStore(PRODUCTS_STORE).index('ownerEmail').getAll(ownerEmail)
    const ordersRequest = transaction.objectStore(ORDERS_STORE).index('ownerEmail').getAll(ownerEmail)
    const [shop, products, orders] = await Promise.all([
      requestResult(shopRequest),
      requestResult(productsRequest),
      requestResult(ordersRequest),
    ])
    await completed

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      ownerEmail,
      shop: shop ?? null,
      products,
      orders,
    }
  } finally {
    database.close()
  }
}

function validateBackupRecord(record, ownerEmail, type) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error(`El respaldo contiene un registro de ${type} inválido.`)
  }
  if (record.ownerEmail !== ownerEmail || typeof record.id !== 'string' || !record.id) {
    throw new Error(`El respaldo contiene un registro de ${type} que no pertenece a esta ferretería.`)
  }
}

function validateAccountBackup(backup, ownerEmail) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)
    || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error('El archivo no es un respaldo de FerroLink compatible.')
  }
  if (backup.ownerEmail !== ownerEmail) {
    throw new Error('Este respaldo pertenece a otra cuenta.')
  }
  if (!Array.isArray(backup.products) || !Array.isArray(backup.orders)
    || backup.products.length > 10_000 || backup.orders.length > 10_000) {
    throw new Error('El respaldo contiene listas de productos o pedidos inválidas.')
  }
  if (backup.shop !== null
    && (!backup.shop || typeof backup.shop !== 'object' || backup.shop.ownerEmail !== ownerEmail)) {
    throw new Error('El perfil de ferretería del respaldo no es válido.')
  }

  const productIds = new Set()
  for (const product of backup.products) {
    validateBackupRecord(product, ownerEmail, 'producto')
    if (productIds.has(product.id)
      || typeof product.name !== 'string'
      || typeof product.category !== 'string'
      || !Number.isFinite(product.price) || product.price < 0
      || !Number.isInteger(product.stock) || product.stock < 0
      || typeof product.available !== 'boolean'
      || (product.isOffer !== undefined && typeof product.isOffer !== 'boolean')
      || (product.isOffer === true
        && (!isValidDateOnly(product.offerStartDate)
          || !isValidDateOnly(product.offerEndDate)
          || product.offerEndDate < product.offerStartDate
          || !Number.isFinite(product.offerPrice)
          || product.offerPrice < 0
          || typeof product.offerDescription !== 'string'
          || !product.offerDescription.trim()
          || product.offerDescription.length > 240))
      || (product.image !== undefined
        && (typeof product.image !== 'string' || product.image.length > MAX_PRODUCT_IMAGE_LENGTH
          || !/^data:image\/(?:jpeg|png|webp);base64,/.test(product.image)))) {
      throw new Error('El respaldo contiene datos de producto inválidos.')
    }
    productIds.add(product.id)
  }

  const orderIds = new Set()
  const statuses = ['Recibido', 'Preparando', 'En camino', 'Entregado', 'Cancelado']
  for (const order of backup.orders) {
    validateBackupRecord(order, ownerEmail, 'pedido')
    if (orderIds.has(order.id)
      || typeof order.customerName !== 'string'
      || typeof order.productId !== 'string'
      || !Number.isInteger(order.quantity) || order.quantity < 1
      || !Number.isFinite(order.total) || order.total < 0
      || !statuses.includes(order.status)
      || (order.customerEmail !== undefined && typeof order.customerEmail !== 'string')) {
      throw new Error('El respaldo contiene datos de pedido inválidos.')
    }
    orderIds.add(order.id)
  }
}

function deleteIndexedRecords(store, ownerEmail) {
  const range = IDBKeyRange.only(ownerEmail)
  const request = store.index('ownerEmail').getAllKeys(range)
  request.onsuccess = () => {
    for (const key of request.result) store.delete(key)
  }
  return request
}

export async function restoreAccountBackup(ownerEmail, backup) {
  validateAccountBackup(backup, ownerEmail)
  const database = await openDatabase()
  try {
    const transaction = database.transaction(
      [SHOPS_STORE, PRODUCTS_STORE, ORDERS_STORE],
      'readwrite',
    )
    const completed = transactionComplete(transaction)
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const shopStore = transaction.objectStore(SHOPS_STORE)

    const productsRequest = deleteIndexedRecords(productsStore, ownerEmail)
    productsRequest.onsuccess = () => {
      for (const product of backup.products) productsStore.put(product)
    }

    const ordersRequest = deleteIndexedRecords(ordersStore, ownerEmail)
    ordersRequest.onsuccess = () => {
      for (const order of backup.orders) ordersStore.put(order)
    }

    if (backup.shop) shopStore.put(backup.shop)
    else shopStore.delete(ownerEmail)

    await completed
  } finally {
    database.close()
  }

  return { products: backup.products.length, orders: backup.orders.length }
}

export async function getPublicCatalogProducts() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction([PRODUCTS_STORE, SHOPS_STORE], 'readonly')
    const completed = transactionComplete(transaction)
    const productsRequest = transaction.objectStore(PRODUCTS_STORE).getAll()
    const shopsRequest = transaction.objectStore(SHOPS_STORE).getAll()
    const [products, shops] = await Promise.all([
      requestResult(productsRequest),
      requestResult(shopsRequest),
    ])
    await completed

    const shopNames = new Map(shops.map((shop) => [shop.ownerEmail, shop.name]))
    return products
      .filter((product) => product.available && product.stock > 0)
      .map((product) => ({
        ...product,
        shopName: shopNames.get(product.ownerEmail) || 'Ferretería aliada',
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
  } finally {
    database.close()
  }
}

export async function getActiveOffers() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction([PRODUCTS_STORE, SHOPS_STORE], 'readonly')
    const completed = transactionComplete(transaction)
    const productsRequest = transaction.objectStore(PRODUCTS_STORE).getAll()
    const shopsRequest = transaction.objectStore(SHOPS_STORE).getAll()
    const [products, shops] = await Promise.all([
      requestResult(productsRequest),
      requestResult(shopsRequest),
    ])
    await completed

    const today = getLocalDateOnly()
    const shopNames = new Map(shops.map((shop) => [shop.ownerEmail, shop.name]))
    return products
      .filter((product) => product.isOffer === true
        && product.available
        && product.stock > 0
        && Number.isFinite(product.offerPrice)
        && typeof product.offerDescription === 'string'
        && product.offerDescription.trim()
        && isValidDateOnly(product.offerStartDate)
        && isValidDateOnly(product.offerEndDate)
        && product.offerStartDate <= today
        && product.offerEndDate >= today)
      .map((product) => ({
        ...product,
        shopName: shopNames.get(product.ownerEmail) || 'Ferretería aliada',
      }))
      .sort((left, right) => left.offerEndDate.localeCompare(right.offerEndDate)
        || left.name.localeCompare(right.name))
  } finally {
    database.close()
  }
}

export async function saveProduct(ownerEmail, productDetails) {
  const name = normalizeText(productDetails.name, 'El nombre del producto', 120)
  const category = normalizeText(productDetails.category, 'La categoría', 80)
  const sku = productDetails.sku.trim().slice(0, 60)
  const price = validatePrice(productDetails.price)
  const stock = validateStock(productDetails.stock)
  const image = productDetails.image
  if (image !== undefined && (typeof image !== 'string' || image.length > MAX_PRODUCT_IMAGE_LENGTH
    || (image && !/^data:image\/(?:jpeg|png|webp);base64,/.test(image)))) {
    throw new Error('La imagen debe ser JPG, PNG o WebP y no superar el límite permitido.')
  }
  const isOffer = productDetails.isOffer === true
  const offerStartDate = isOffer ? productDetails.offerStartDate : ''
  const offerEndDate = isOffer ? productDetails.offerEndDate : ''
  if (isOffer && (!isValidDateOnly(offerStartDate)
    || !isValidDateOnly(offerEndDate)
    || offerEndDate < offerStartDate)) {
    throw new Error('Ingresa un rango de fechas válido para la oferta.')
  }
  if (isOffer && (productDetails.offerPrice === undefined
    || productDetails.offerPrice === null
    || productDetails.offerPrice === '')) {
    throw new Error('Ingresa un precio de oferta válido.')
  }
  const offerPrice = isOffer ? validatePrice(productDetails.offerPrice) : null
  const offerDescription = isOffer
    ? normalizeText(productDetails.offerDescription, 'La descripción de la oferta', 240)
    : ''
  const database = await openDatabase()

  try {
    const transaction = database.transaction(PRODUCTS_STORE, 'readwrite')
    const store = transaction.objectStore(PRODUCTS_STORE)
    const completed = transactionComplete(transaction)
    const existing = productDetails.id
      ? await requestResult(store.get(productDetails.id))
      : null

    if (existing && existing.ownerEmail !== ownerEmail) {
      throw new Error('No se encontró el producto solicitado.')
    }

    const product = {
      id: existing?.id ?? createId(),
      ownerEmail,
      name,
      category,
      sku,
      price,
      stock,
      available: productDetails.available ?? true,
      isOffer,
      offerPrice,
      offerDescription,
      offerStartDate,
      offerEndDate,
      image: image ?? existing?.image ?? '',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await requestResult(store.put(product))
    await completed
    return product
  } finally {
    database.close()
  }
}

export async function deleteProduct(ownerEmail, productId) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction([PRODUCTS_STORE, ORDERS_STORE], 'readwrite')
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const completed = transactionComplete(transaction)
    const productRequest = productsStore.get(productId)

    productRequest.onsuccess = () => {
      const product = productRequest.result
      if (!product || product.ownerEmail !== ownerEmail) {
        transaction.abort()
        return
      }

      const ordersRequest = ordersStore.index('ownerEmail').getAll(ownerEmail)
      ordersRequest.onsuccess = () => {
        const hasOpenOrder = ordersRequest.result.some(
          (order) => order.productId === productId
            && !['Entregado', 'Cancelado'].includes(order.status),
        )
        if (hasOpenOrder) {
          transaction.abort()
          return
        }
        productsStore.delete(productId)
      }
    }

    try {
      await completed
    } catch (error) {
      if (!productRequest.result || productRequest.result.ownerEmail !== ownerEmail) {
        throw new Error('No se encontró el producto solicitado.', { cause: error })
      }
      const orders = await getOrders(ownerEmail)
      if (orders.some((order) => order.productId === productId
        && !['Entregado', 'Cancelado'].includes(order.status))) {
        throw new Error('No puedes eliminar un producto con pedidos pendientes. Pausa su disponibilidad.', { cause: error })
      }
      throw error
    }
  } finally {
    database.close()
  }
}

export async function getOrders(ownerEmail) {
  const orders = await getAccountRecords(ORDERS_STORE, ownerEmail)
  return orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function getCustomerOrders(customerEmail) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(ORDERS_STORE, 'readonly')
    const completed = transactionComplete(transaction)
    const orders = await requestResult(
      transaction.objectStore(ORDERS_STORE).index('customerEmail').getAll(customerEmail),
    )
    await completed
    return orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  } finally {
    database.close()
  }
}

export async function createCustomerOrder(customerEmail, details) {
  const normalizedEmail = customerEmail.trim().toLowerCase()
  const customerName = normalizeText(details.customerName, 'El nombre del cliente', 120)
  const deliveryAddress = details.deliveryAddress.trim().slice(0, 180)
  const quantity = validateStock(details.quantity)
  if (quantity < 1) throw new Error('La cantidad debe ser al menos uno.')

  const database = await openDatabase()
  try {
    const transaction = database.transaction(
      [PRODUCTS_STORE, SHOPS_STORE, ORDERS_STORE],
      'readwrite',
    )
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const shopsStore = transaction.objectStore(SHOPS_STORE)
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const completed = transactionComplete(transaction)
    const productRequest = productsStore.get(details.productId)
    let createdOrder

    productRequest.onsuccess = () => {
      const product = productRequest.result
      if (!product || !product.available || product.stock < quantity) {
        transaction.abort()
        return
      }

      const shopRequest = shopsStore.get(product.ownerEmail)
      shopRequest.onsuccess = () => {
        product.stock -= quantity
        product.updatedAt = new Date().toISOString()
        createdOrder = {
          id: createId(),
          ownerEmail: product.ownerEmail,
          customerEmail: normalizedEmail,
          customerName,
          deliveryAddress,
          productId: product.id,
          productName: product.name,
          shopName: shopRequest.result?.name || 'Ferretería aliada',
          quantity,
          unitPrice: product.price,
          total: Math.round(product.price * quantity * 100) / 100,
          status: 'Recibido',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        productsStore.put(product)
        ordersStore.add(createdOrder)
      }
    }

    try {
      await completed
    } catch (error) {
      const product = productRequest.result
      if (!product || !product.available) {
        throw new Error('El producto ya no está disponible.', { cause: error })
      }
      if (product.stock < quantity) {
        throw new Error('No hay suficientes existencias para esa cantidad.', { cause: error })
      }
      throw error
    }
    return createdOrder
  } finally {
    database.close()
  }
}

export async function createCustomerCartOrders(customerEmail, details, items) {
  const normalizedEmail = customerEmail.trim().toLowerCase()
  const customerName = normalizeText(details.customerName, 'El nombre del cliente', 120)
  const deliveryAddress = normalizeText(details.deliveryAddress, 'La dirección de entrega', 180)
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error('El carrito no contiene productos válidos para realizar el pedido.')
  }

  const itemIds = new Set()
  const requestedItems = items.map((item) => {
    if (typeof item.productId !== 'string' || itemIds.has(item.productId)) {
      throw new Error('El carrito contiene productos repetidos o inválidos.')
    }
    itemIds.add(item.productId)
    const quantity = validateStock(item.quantity)
    if (quantity < 1) throw new Error('La cantidad debe ser al menos uno.')
    if (!Number.isFinite(item.expectedOfferPrice) || item.expectedOfferPrice < 0) {
      throw new Error('El carrito contiene un precio de oferta inválido.')
    }
    return { productId: item.productId, quantity, expectedOfferPrice: item.expectedOfferPrice }
  })

  const database = await openDatabase()
  try {
    const transaction = database.transaction(
      [PRODUCTS_STORE, SHOPS_STORE, ORDERS_STORE],
      'readwrite',
    )
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const shopsStore = transaction.objectStore(SHOPS_STORE)
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const completed = transactionComplete(transaction)
    const today = getLocalDateOnly()
    const lines = []
    let remainingItems = requestedItems.length
    let failureMessage = ''
    let createdOrders = []

    for (const requestedItem of requestedItems) {
      const productRequest = productsStore.get(requestedItem.productId)
      productRequest.onsuccess = () => {
        if (failureMessage) return
        const product = productRequest.result
        if (!product || !product.available || product.stock < requestedItem.quantity) {
          failureMessage = 'Un producto del carrito ya no está disponible o no tiene existencias suficientes.'
          transaction.abort()
          return
        }

        if (product.isOffer !== true
          || !isValidDateOnly(product.offerStartDate)
          || !isValidDateOnly(product.offerEndDate)
          || product.offerStartDate > today
          || product.offerEndDate < today
          || !Number.isFinite(product.offerPrice)
          || product.offerPrice < 0) {
          failureMessage = `La oferta de "${product.name}" ya no está vigente. Actualiza el carrito.`
          transaction.abort()
          return
        }
        if (product.offerPrice !== requestedItem.expectedOfferPrice) {
          failureMessage = `El precio de "${product.name}" cambió. Actualiza el carrito antes de pedir.`
          transaction.abort()
          return
        }

        const shopRequest = shopsStore.get(product.ownerEmail)
        shopRequest.onsuccess = () => {
          if (failureMessage) return
          lines.push({ product, quantity: requestedItem.quantity, shop: shopRequest.result })
          remainingItems -= 1
          if (remainingItems !== 0) return

          try {
            const createdAt = new Date().toISOString()
            createdOrders = lines.map(({ product: currentProduct, quantity, shop }) => {
              currentProduct.stock -= quantity
              currentProduct.updatedAt = createdAt
              const unitPrice = currentProduct.offerPrice
              const order = {
                id: createId(),
                ownerEmail: currentProduct.ownerEmail,
                customerEmail: normalizedEmail,
                customerName,
                deliveryAddress,
                productId: currentProduct.id,
                productName: currentProduct.name,
                shopName: shop?.name || 'Ferretería aliada',
                quantity,
                unitPrice,
                total: Math.round(unitPrice * quantity * 100) / 100,
                status: 'Recibido',
                createdAt,
                updatedAt: createdAt,
              }
              productsStore.put(currentProduct)
              ordersStore.add(order)
              return order
            })
          } catch (error) {
            failureMessage = error instanceof Error
              ? error.message
              : 'No se pudieron preparar los pedidos del carrito.'
            transaction.abort()
          }
        }
      }
    }

    try {
      await completed
    } catch (error) {
      if (failureMessage) throw new Error(failureMessage, { cause: error })
      throw error
    }
    return createdOrders
  } finally {
    database.close()
  }
}

export async function createOrder(ownerEmail, details) {
  const customerName = normalizeText(details.customerName, 'El nombre del cliente', 120)
  const deliveryAddress = details.deliveryAddress.trim().slice(0, 180)
  const quantity = validateStock(details.quantity)
  if (quantity < 1) throw new Error('La cantidad debe ser al menos uno.')

  const database = await openDatabase()
  try {
    const transaction = database.transaction([PRODUCTS_STORE, ORDERS_STORE], 'readwrite')
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const completed = transactionComplete(transaction)
    const productRequest = productsStore.get(details.productId)
    let order

    productRequest.onsuccess = () => {
      const product = productRequest.result
      if (!product || product.ownerEmail !== ownerEmail || !product.available) {
        transaction.abort()
        return
      }
      if (product.stock < quantity) {
        transaction.abort()
        return
      }

      product.stock -= quantity
      product.updatedAt = new Date().toISOString()
      order = {
        id: createId(),
        ownerEmail,
        customerName,
        deliveryAddress,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total: Math.round(product.price * quantity * 100) / 100,
        status: 'Recibido',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      productsStore.put(product)
      ordersStore.add(order)
    }

    try {
      await completed
    } catch (error) {
      if (productRequest.result?.stock < quantity) {
        throw new Error('No hay suficientes existencias para ese pedido.', { cause: error })
      }
      if (!productRequest.result || productRequest.result.ownerEmail !== ownerEmail) {
        throw new Error('No se encontró un producto disponible para el pedido.', { cause: error })
      }
      if (!productRequest.result.available) {
        throw new Error('El producto no está disponible para la venta.', { cause: error })
      }
      throw error
    }
    return order
  } finally {
    database.close()
  }
}

export async function updateOrderStatus(ownerEmail, orderId, status) {
  const transitions = {
    Recibido: ['Preparando', 'Cancelado'],
    Preparando: ['En camino', 'Cancelado'],
    'En camino': ['Entregado', 'Cancelado'],
    Entregado: [],
    Cancelado: [],
  }

  const database = await openDatabase()
  try {
    const transaction = database.transaction([ORDERS_STORE, PRODUCTS_STORE], 'readwrite')
    const ordersStore = transaction.objectStore(ORDERS_STORE)
    const productsStore = transaction.objectStore(PRODUCTS_STORE)
    const completed = transactionComplete(transaction)
    const orderRequest = ordersStore.get(orderId)
    let updatedOrder

    orderRequest.onsuccess = () => {
      const order = orderRequest.result
      if (!order || order.ownerEmail !== ownerEmail) {
        transaction.abort()
        return
      }

      if (status === 'Cancelado') {
        if (!transitions[order.status]?.includes(status)) {
          transaction.abort()
          return
        }
        const productRequest = productsStore.get(order.productId)
        productRequest.onsuccess = () => {
          const product = productRequest.result
          if (product?.ownerEmail === ownerEmail) {
            product.stock += order.quantity
            product.updatedAt = new Date().toISOString()
            productsStore.put(product)
          }
          order.status = status
          order.updatedAt = new Date().toISOString()
          updatedOrder = order
          ordersStore.put(order)
        }
      } else {
        if (!transitions[order.status]?.includes(status)) {
          transaction.abort()
          return
        }
        order.status = status
        order.updatedAt = new Date().toISOString()
        updatedOrder = order
        ordersStore.put(order)
      }
    }

    try {
      await completed
    } catch (error) {
      if (!orderRequest.result || orderRequest.result.ownerEmail !== ownerEmail) {
        throw new Error('No se encontró el pedido solicitado.', { cause: error })
      }
      if (orderRequest.result.status === 'Cancelado') {
        throw new Error('Un pedido cancelado no se puede modificar.', { cause: error })
      }
      if (!transitions[orderRequest.result.status]?.includes(status)) {
        throw new Error('Ese cambio de estado no está permitido para el pedido.', { cause: error })
      }
      throw error
    }
    return updatedOrder
  } finally {
    database.close()
  }
}

export async function registerLocalUser({ name, email, password, role }) {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const allowedRoles = ['customer', 'merchant', 'transporter']
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw new Error('El nombre debe tener entre 2 y 100 caracteres.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Ingresa un correo electrónico válido.')
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }
  if (!allowedRoles.includes(role)) {
    throw new Error('Selecciona un tipo de usuario válido.')
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
      role,
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

    return { name: normalizedName, email: normalizedEmail, role }
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

export async function updateLocalUserProfile(email, details) {
  const normalizedEmail = email.trim().toLowerCase()
  const name = details.name.trim()
  if (name.length < 2 || name.length > 100) {
    throw new Error('El nombre debe tener entre 2 y 100 caracteres.')
  }

  const database = await openDatabase()
  try {
    const transaction = database.transaction(USERS_STORE, 'readwrite')
    const completed = transactionComplete(transaction)
    const store = transaction.objectStore(USERS_STORE)
    const user = await requestResult(store.get(normalizedEmail))
    if (!user) {
      await completed
      throw new Error('No se encontró la cuenta para actualizar.')
    }

    user.name = name
    await requestResult(store.put(user))
    await completed
    return toProfile(user)
  } finally {
    database.close()
  }
}
