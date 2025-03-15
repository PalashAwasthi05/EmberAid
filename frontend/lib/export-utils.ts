import type { DetectedItem } from "@/types/types"

// Export data to CSV
export async function exportToCSV(items: DetectedItem[]): Promise<void> {
  // Simulate export delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Create CSV content
  const headers = ["Item", "Estimated Value ($)", "Source"]
  const rows = items.map((item) => [
    item.label,
    (item.estimatedValue || 0).toFixed(2),
    // Only include source if price wasn't modified
    item.isPriceModified ? "Manual Entry" : item.valueSource || "Manual Entry",
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `emberaid-export-${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

// Export data to Excel
export async function exportToExcel(items: DetectedItem[]): Promise<void> {
  // Simulate export delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // In a real app, you would use a library like exceljs or xlsx
  // For this simulation, we'll just create a CSV with a different extension

  const headers = ["Item", "Estimated Value ($)", "Source"]
  const rows = items.map((item) => [
    item.label,
    (item.estimatedValue || 0).toFixed(2),
    // Only include source if price wasn't modified
    item.isPriceModified ? "Manual Entry" : item.valueSource || "Manual Entry",
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `emberaid-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

