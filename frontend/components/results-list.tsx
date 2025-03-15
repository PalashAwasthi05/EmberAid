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
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">Item</th>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">Estimated Value</th>
            </tr>
          </thead>
          <tbody>
            {detectedItems.map((item, index) => (
              <motion.tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-800">{item.label}</div>
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
                <td className="py-4 px-6">
                  <div className="flex items-center">
                    <div className="p-1 bg-gray-100 rounded-md mr-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                    </div>
                    <input
                      type="number"
                      value={item.estimatedValue || ""}
                      onChange={(e) => updateItemValue(item.id, Number.parseFloat(e.target.value) || 0)}
                      placeholder={item.estimatedValue ? undefined : "Enter value"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </td>
              </motion.tr>
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

