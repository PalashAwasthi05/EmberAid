"use client"

import { useState } from "react"
import type { DetectedItem } from "@/types/types"
import {
  Download,
  DollarSign,
  Loader2,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  ExternalLink,
  Edit,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { exportToCSV, exportToExcel } from "@/lib/export-utils"
import { motion, AnimatePresence } from "framer-motion"

interface ResultsListProps {
  detectedItems: DetectedItem[]
  updateItemValue: (id: string, value: number) => void
  isProcessing: boolean
}

export function ResultsList({ detectedItems, updateItemValue, isProcessing }: ResultsListProps) {
  const [exportType, setExportType] = useState<"csv" | "excel" | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  const totalValue = detectedItems.reduce((sum, item) => sum + (item.estimatedValue || 0), 0)

  const handleExport = async (type: "csv" | "excel") => {
    setExportType(type)
    setIsExporting(true)
    setShowExportOptions(false)

    try {
      if (type === "csv") {
        await exportToCSV(detectedItems)
      } else {
        await exportToExcel(detectedItems)
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const startEdit = (item: DetectedItem) => {
    setIsEditing(item.id)
    setEditValue(item.estimatedValue || 0)
  }

  const saveEdit = () => {
    if (isEditing) {
      updateItemValue(isEditing, editValue)
      setIsEditing(null)
    }
  }

  const cancelEdit = () => {
    setIsEditing(null)
  }

  if (isProcessing) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-md p-8 h-full flex items-center justify-center border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center text-gray-500">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          </motion.div>
          <p className="text-lg font-medium">Analyzing image and detecting objects...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
        </div>
      </motion.div>
    )
  }

  if (detectedItems.length === 0 && !isProcessing) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-md p-8 h-full flex items-center justify-center border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <p className="text-lg font-medium">No items detected</p>
          <p className="text-sm text-gray-400 mt-2">Try uploading a different image with clearer objects</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Detected Items</h2>
          <div className="relative">
            <motion.button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {showExportOptions && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    <span>Export as Excel</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3 text-right">Value ($)</th>
              <th className="px-6 py-3 text-right">Source</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {detectedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{item.label}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.details && (
                    <>
                      {item.details.color && <span>Color: {item.details.color}<br/></span>}
                      {item.details.material && <span>Material: {item.details.material}<br/></span>}
                      {item.details.dimensions && <span>Size: {item.details.dimensions}</span>}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {isEditing === item.id ? (
                    <div className="flex items-center justify-end">
                      <span className="mr-1">$</span>
                      <input
                        type="number"
                        className="w-24 py-1 px-2 border border-gray-300 rounded-md text-right"
                        value={editValue}
                        onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end text-gray-900">
                      ${item.estimatedValue ? item.estimatedValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) : "0.00"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {item.sourceUrl && item.valueSource && !item.isPriceModified && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <span>Source: </span>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 ml-1 inline-flex items-center"
                      >
                        {item.valueSource}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                  {item.isPriceModified && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center">
                      <Edit className="h-3 w-3 mr-1" />
                      <span>Manually adjusted</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {isEditing === item.id ? (
                    <div className="flex space-x-1">
                      <button 
                        onClick={saveEdit}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEdit(item)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        className="border-t border-gray-100 p-6 bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Estimated Value:</span>
          <span className="text-2xl font-bold text-orange-600">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

