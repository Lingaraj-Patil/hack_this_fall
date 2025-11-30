import { useRef, useState, useCallback } from 'react'
import { visionAPI } from '../api/vision'

const DIRECT_VISION_ENABLED = (import.meta.env.VITE_DIRECT_VISION_PREVIEW === 'true') && !!import.meta.env.VITE_VISION_API_URL

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
      // If direct preview is enabled, try calling the ML API directly from the browser.
      if (DIRECT_VISION_ENABLED) {
        try {
          const url = `${import.meta.env.VITE_VISION_API_URL.replace(/\/$/, '')}/api/analyze`
          const start = Date.now()
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
          })
          const latency = Date.now() - start
          if (!r.ok) throw new Error(`Direct vision API error ${r.status}`)
          const data = await r.json()
          return { success: true, data, latency, source: 'direct' }
        } catch (err) {
          // Direct call failed (CORS or network). Fall back to backend proxy.
          console.warn('Direct vision preview failed, falling back to backend:', err.message)
        }
      }

      const response = await visionAPI.analyze({ image: base64Image, sessionId })
      // Handle response structure: response.data.data.analysis or response.data.analysis
      const analysisData = response.data?.data?.analysis || response.data?.analysis || response.data?.data || response.data
      return { 
        success: true, 
        data: analysisData, 
        latency: response.data?.latency ?? response.latency ?? null, 
        source: 'proxy' 
      }
    } catch (error) {
      // Normalize axios errors to include status where available so callers can back off
      const status = error?.response?.status || error?.code || null
      const message = error?.message || 'Vision API error'
      console.error('Vision API error:', error)
      return { success: false, error: message, status }
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
