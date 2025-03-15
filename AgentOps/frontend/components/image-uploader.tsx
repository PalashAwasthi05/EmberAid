"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { AlertCircle, Upload, FileImage } from "lucide-react"
import { motion } from "framer-motion"

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string) => void
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    setError(null)

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG or PNG)")
      return
    }

    // Read and convert file to data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUpload(e.target.result as string)
      }
    }
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-orange-500 bg-orange-50 shadow-lg"
            : "border-gray-200 hover:border-orange-400 hover:bg-gray-50 hover:shadow-md"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl" />
          {isDragging && (
            <motion.div
              className="absolute inset-0 bg-orange-500/10 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
          <motion.div
            className="p-6 bg-white rounded-full text-orange-500 shadow-md"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <Upload className="h-10 w-10" />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Drag and drop your image here</h3>
            <p className="text-gray-600 mb-4">
              or <span className="text-orange-600 font-medium underline">browse files</span>
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <FileImage className="h-4 w-4 mr-1" />
                <span>JPEG</span>
              </div>
              <div className="flex items-center">
                <FileImage className="h-4 w-4 mr-1" />
                <span>PNG</span>
              </div>
            </div>
          </div>
        </div>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
        />
      </motion.div>

      {error && (
        <motion.div
          className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  )
}

