import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import {
  getImageModelMetadata,
  saveImageModelMetadata,
} from './localAuth'

const CLASSIFIER_MODEL_URL = 'indexeddb://ferrolink-product-image-classifier'

let mobilenetModelPromise
let classifierModelPromise

async function getMobileNetModel() {
  if (!mobilenetModelPromise) {
    mobilenetModelPromise = tf.ready().then(() => mobilenet.load({ version: 2, alpha: 1.0 }))
  }
  try {
    return await mobilenetModelPromise
  } catch (error) {
    mobilenetModelPromise = undefined
    throw new Error('No se pudo cargar MobileNet. Comprueba tu conexión e inténtalo nuevamente.', { cause: error })
  }
}

async function getImageEmbedding(image) {
  const model = await getMobileNetModel()
  const embedding = tf.tidy(() => model.infer(image, true).flatten())
  try {
    return Array.from(await embedding.data())
  } finally {
    embedding.dispose()
  }
}

export async function extractProductImageEmbedding(file) {
  if (!(file instanceof Blob) || !file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 10 MB.')
  }
  if (!globalThis.createImageBitmap) {
    throw new Error('Este navegador no permite procesar imágenes para la búsqueda visual.')
  }

  const image = await createImageBitmap(file)
  try {
    return await getImageEmbedding(image)
  } finally {
    image.close()
  }
}

export async function trainMobileNetProductClassifier(examples, onProgress) {
  const examplesByProduct = new Map()
  for (const example of examples) {
    if (!Array.isArray(example.embedding) || !example.embedding.length) {
      throw new Error('Hay imágenes de entrenamiento inválidas. Elimínalas y vuelve a cargarlas.')
    }
    const group = examplesByProduct.get(example.productId) ?? {
      productId: example.productId,
      productName: example.productName,
      examples: [],
    }
    group.examples.push(example)
    examplesByProduct.set(example.productId, group)
  }

  const productGroups = [...examplesByProduct.values()]
    .sort((left, right) => left.productId.localeCompare(right.productId))
  if (productGroups.length < 2) {
    throw new Error('Agrega imágenes de al menos dos productos diferentes para entrenar el clasificador.')
  }
  const underrepresented = productGroups.filter((group) => group.examples.length < 2)
  if (underrepresented.length) {
    throw new Error('Agrega al menos dos imágenes por producto. Así el clasificador podrá aprender cada categoría.')
  }

  const classes = productGroups.map(({ productId, productName }) => ({ productId, productName }))
  const classIndex = new Map(classes.map((item, index) => [item.productId, index]))
  const trainingExamples = productGroups.flatMap((group) => group.examples)
  const embeddingSize = trainingExamples[0].embedding.length
  if (trainingExamples.some((example) => example.embedding.length !== embeddingSize)) {
    throw new Error('Las imágenes guardadas usan características incompatibles. Elimínalas y vuelve a cargarlas.')
  }

  const features = tf.tensor2d(trainingExamples.map((example) => example.embedding))
  const classIds = tf.tensor1d(
    trainingExamples.map((example) => classIndex.get(example.productId)),
    'int32',
  )
  const labels = tf.oneHot(classIds, classes.length)
  const classifier = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [embeddingSize], units: 128, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.25 }),
      tf.layers.dense({ units: classes.length, activation: 'softmax' }),
    ],
  })
  classifier.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  })

  try {
    await classifier.fit(features, labels, {
      epochs: 40,
      batchSize: Math.min(16, trainingExamples.length),
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch) => {
          onProgress?.(epoch + 1, 40)
        },
      },
    })
    await classifier.save(CLASSIFIER_MODEL_URL)
    const metadata = await saveImageModelMetadata({
      classes,
      exampleCount: trainingExamples.length,
    })

    classifierModelPromise = Promise.resolve(classifier)
    return metadata
  } catch (error) {
    classifier.dispose()
    throw new Error('No se pudo entrenar o guardar el clasificador de productos.', { cause: error })
  } finally {
    features.dispose()
    classIds.dispose()
    labels.dispose()
  }
}

async function getClassifierModel() {
  if (!classifierModelPromise) {
    classifierModelPromise = tf.loadLayersModel(CLASSIFIER_MODEL_URL)
  }
  try {
    return await classifierModelPromise
  } catch (error) {
    classifierModelPromise = undefined
    throw new Error('No se encontró el modelo local. Pide al administrador que entrene MobileNet primero.', { cause: error })
  }
}

export async function findProductsByImage(file) {
  const metadata = await getImageModelMetadata()
  if (!metadata?.classes?.length) {
    throw new Error('El administrador todavía no ha entrenado el modelo de búsqueda visual.')
  }

  const embedding = await extractProductImageEmbedding(file)
  const classifier = await getClassifierModel()
  const input = tf.tensor2d([embedding])
  let prediction
  try {
    prediction = classifier.predict(input)
    const scores = Array.from(await prediction.data())
    if (scores.length !== metadata.classes.length || scores.some((score) => !Number.isFinite(score))) {
      throw new Error('El modelo y sus etiquetas no coinciden. Pide al administrador que vuelva a entrenarlo.')
    }
    return metadata.classes
      .map((item, index) => ({ ...item, confidence: scores[index] }))
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 3)
  } finally {
    input.dispose()
    prediction?.dispose()
  }
}
