"use client"

import { useState } from "react"
import { ImageUploader } from "./image-uploader"
import { ImageAnnotation } from "./image-annotation"
import { ResultsList } from "./results-list"
import type { DetectedItem } from "@/types/types"
import { uploadImageForDetection, fallbackToSimulation } from "@/lib/api"
import { Flame, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function EmberAidApp() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)

  const handleImageUpload = async (imageDataUrl: string, imageFile: File) => {
    setUploadedImage(imageDataUrl)
    setIsProcessing(true)
    setError(null)

    try {
      let items: DetectedItem[]
      
      if (useFallback) {
        // Use simulation if backend is not available
        items = await fallbackToSimulation(imageDataUrl)
      } else {
        try {
          // Try to use the real API
          items = await uploadImageForDetection(imageFile)
        } catch (err) {
          console.error("Error with real API, falling back to simulation:", err)
          setUseFallback(true)
          items = await fallbackToSimulation(imageDataUrl)
        }
      }
      
      setDetectedItems(items)
    } catch (err) {
      setError("Failed to process the image. Please try again.")
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const updateItemValue = (id: string, value: number) => {
    setDetectedItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, estimatedValue: value, isPriceModified: true } : item)),
    )
  }

  const resetUpload = () => {
    setUploadedImage(null)
    setDetectedItems([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">EmberAid</h1>
          </div>
          <div className="text-sm text-gray-500">Wildfire Claims Submission Tool</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!uploadedImage ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-3xl mx-auto text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Document Your Loss</h2>
                <p className="text-gray-600 mb-8">
                  Upload an image of your property damage, and we'll help identify and value the items for your claim.
                </p>
              </div>
              <ImageUploader onImageUpload={handleImageUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-6">
                <button
                  onClick={resetUpload}
                  className="flex items-center text-orange-600 hover:text-orange-800 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  <span>Upload New Image</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ImageAnnotation imageUrl={uploadedImage} detectedItems={detectedItems} isProcessing={isProcessing} />
                </div>
                <ResultsList
                  detectedItems={detectedItems}
                  updateItemValue={updateItemValue}
                  isProcessing={isProcessing}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} EmberAid. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

