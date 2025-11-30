import { useRef, useState, useCallback } from 'react'
import { visionAPI } from '../api/vision'

export function useWebcam() {
  const webcamRef = useRef(null)
  const [isWebcamReady, setIsWebcamReady] = useState(false)

  const captureFrame = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      return imageSrc
    }
    return null
  }, [])

  const sendFrameToAPI = useCallback(async (imageData, sessionId) => {
    try {
      const base64Image = imageData.split(',')[1]
      const response = await visionAPI.analyze({
        image: base64Image,
        sessionId,
      })
      return response.data
    } catch (error) {
      console.error('Vision API error:', error)
      return null
    }
  }, [])

  return {
    webcamRef,
    isWebcamReady,
    setIsWebcamReady,
    captureFrame,
    sendFrameToAPI,
  }
}
