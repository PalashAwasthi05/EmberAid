"use client"

import { useEffect, useRef, useState } from "react"
import type { DetectedItem } from "@/types/types"
import { Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ImageAnnotationProps {
  imageUrl: string
  detectedItems: DetectedItem[]
  isProcessing: boolean
}

export function ImageAnnotation({ imageUrl, detectedItems, isProcessing }: ImageAnnotationProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Draw bounding boxes when image is loaded and items are available
  useEffect(() => {
    if (imageLoaded && detectedItems.length > 0 && !isProcessing) {
      drawBoundingBoxes()
    }
  }, [imageLoaded, detectedItems, isProcessing, hoveredItem, zoom, rotation])

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true)
    if (imageRef.current && canvasRef.current && containerRef.current) {
      // Set canvas dimensions to match the image
      canvasRef.current.width = imageRef.current.width
      canvasRef.current.height = imageRef.current.height
    }
  }

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each bounding box
    detectedItems.forEach((item) => {
      const { x, y, width, height } = item.boundingBox
      const isHovered = hoveredItem === item.id

      // Calculate actual coordinates based on image dimensions
      const actualX = x * canvas.width
      const actualY = y * canvas.height
      const actualWidth = width * canvas.width
      const actualHeight = height * canvas.height

      // Set styles based on hover state
      ctx.lineWidth = isHovered ? 3 : 2
      ctx.strokeStyle = isHovered ? "#f97316" : "#f59e0b"
      ctx.fillStyle = isHovered ? "rgba(249, 115, 22, 0.2)" : "rgba(245, 158, 11, 0.1)"

      // Draw rectangle
      ctx.fillRect(actualX, actualY, actualWidth, actualHeight)
      ctx.strokeRect(actualX, actualY, actualWidth, actualHeight)

      // Draw label
      ctx.font = isHovered ? "bold 14px Arial" : "12px Arial"
      const labelWidth = ctx.measureText(item.label).width + 10
      const labelHeight = 20
      const labelX = actualX
      const labelY = actualY - labelHeight

      // Draw label background
      ctx.fillStyle = isHovered ? "#f97316" : "#f59e0b"
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight)

      // Draw label text
      ctx.fillStyle = "white"
      ctx.fillText(item.label, labelX + 5, labelY + 15)
    })
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden shadow-md bg-white border border-gray-100"
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              </motion.div>
              <p className="text-xl font-medium text-gray-800">Analyzing image...</p>
              <p className="text-sm text-gray-500 mt-2">Detecting objects and estimating values</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden">
        <div
          className="transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt="Uploaded property damage"
            className="w-full h-auto"
            onLoad={handleImageLoad}
          />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        </div>
      </div>

      {!isProcessing && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Rotate image"
          >
            <RotateCw className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}

      {detectedItems.length > 0 && !isProcessing && (
        <motion.div
          className="p-4 bg-white border-t border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            {detectedItems.length} {detectedItems.length === 1 ? "item" : "items"} detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {detectedItems.map((item) => (
              <motion.span
                key={item.id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  hoveredItem === item.id ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

