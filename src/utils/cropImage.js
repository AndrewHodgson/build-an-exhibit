function loadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', reject, { once: true })
    image.src = imageSrc
  })
}

export async function createCroppedImageUrl(imageSrc, cropPixels, outputSize) {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = outputSize.width
  canvas.height = outputSize.height

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outputSize.width,
    outputSize.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to crop image.'))
          return
        }

        resolve(URL.createObjectURL(blob))
      },
      'image/jpeg',
      0.92,
    )
  })
}
