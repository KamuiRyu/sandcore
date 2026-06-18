import { useCallback, useState, type ChangeEvent } from 'react'

type CropArea = {
  height: number
  width: number
  x: number
  y: number
}

export function useShareImageCrop() {
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

  const onCropComplete = useCallback(
    (_croppedArea: CropArea, nextCroppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(nextCroppedAreaPixels)
    },
    [],
  )

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      setCustomImageUrl(reader.result as string)
      setIsCropping(true)
    }

    reader.readAsDataURL(file)
  }

  const createCroppedImage = useCallback(async () => {
    if (!customImageUrl || !croppedAreaPixels) return

    const image = new Image()
    image.src = customImageUrl
    await new Promise((resolve) => {
      image.onload = resolve
    })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    )

    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], 'shinobi-share-cover.webp', {
        type: 'image/webp',
      })
      const reader = new FileReader()
      reader.onloadend = () => {
        setCroppedImageFile(file)
        setCroppedImageUrl(reader.result as string)
        setIsCropping(false)
      }
      reader.readAsDataURL(blob)
    }, 'image/webp')
  }, [customImageUrl, croppedAreaPixels])

  function clearImage() {
    setCustomImageUrl(null)
    setCroppedImageUrl(null)
    setCroppedImageFile(null)
  }

  function closeCrop() {
    setIsCropping(false)
  }

  const setExternalImage = useCallback((url: string | null) => {
    setCustomImageUrl(null)
    setCroppedImageFile(null)
    setCroppedImageUrl(url)
    setIsCropping(false)
  }, [])

  return {
    clearImage,
    closeCrop,
    createCroppedImage,
    crop,
    croppedImageFile,
    croppedImageUrl,
    customImageUrl,
    handleImageUpload,
    isCropping,
    onCropComplete,
    setCrop,
    setCroppedImageUrl,
    setExternalImage,
    setZoom,
    zoom,
  }
}
