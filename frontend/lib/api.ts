import type { DetectedItem } from "@/types/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Upload image and get detected objects
export async function uploadImageForDetection(imageFile: File): Promise<DetectedItem[]> {
  try {
    const formData = new FormData()
    formData.append("file", imageFile)

    const response = await fetch(`${API_BASE_URL}/api/detect-objects`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to process image")
    }

    const detectedItems: DetectedItem[] = await response.json()
    return detectedItems
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Fallback to simulation if needed during development
export async function fallbackToSimulation(imageDataUrl: string): Promise<DetectedItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500))

  // Generate random items based on the image
  const items: DetectedItem[] = [
    {
      id: "1",
      label: "Sofa",
      boundingBox: {
        x: 0.1,
        y: 0.3,
        width: 0.4,
        height: 0.3,
      },
      estimatedValue: 1200,
      valueSource: "Furniture Marketplace",
      sourceUrl: "https://furnitureshop.example.com/sofas/modern-sectional",
      isPriceModified: false,
    },
    {
      id: "2",
      label: "Coffee Table",
      boundingBox: {
        x: 0.5,
        y: 0.5,
        width: 0.3,
        height: 0.2,
      },
      estimatedValue: 350,
      valueSource: "Home Furnishings",
      sourceUrl: "https://homefurnishings.example.com/tables/coffee",
      isPriceModified: false,
    },
    {
      id: "3",
      label: "TV",
      boundingBox: {
        x: 0.7,
        y: 0.2,
        width: 0.25,
        height: 0.15,
      },
      estimatedValue: 800,
      valueSource: "Electronics Store",
      sourceUrl: "https://electronics.example.com/tvs/smart-4k",
      isPriceModified: false,
    },
    {
      id: "4",
      label: "Bookshelf",
      boundingBox: {
        x: 0.85,
        y: 0.4,
        width: 0.15,
        height: 0.4,
      },
      estimatedValue: 250,
      valueSource: "Furniture Outlet",
      sourceUrl: "https://furnitureoutlet.example.com/shelving/bookcases",
      isPriceModified: false,
    },
    {
      id: "5",
      label: "Lamp",
      boundingBox: {
        x: 0.6,
        y: 0.1,
        width: 0.1,
        height: 0.2,
      },
      estimatedValue: 120,
      valueSource: "Home Goods",
      sourceUrl: "https://homegoods.example.com/lighting/table-lamps",
      isPriceModified: false,
    },
    {
      id: "6",
      label: "Rug",
      boundingBox: {
        x: 0.3,
        y: 0.7,
        width: 0.5,
        height: 0.2,
      },
      estimatedValue: 450,
      valueSource: "Home Decor",
      sourceUrl: "https://homedecor.example.com/rugs/area-rugs",
      isPriceModified: false,
    },
    {
      id: "7",
      label: "Curtains",
      boundingBox: {
        x: 0.85,
        y: 0.1,
        width: 0.1,
        height: 0.5,
      },
      estimatedValue: 180,
      valueSource: "Home Textiles",
      sourceUrl: "https://hometextiles.example.com/curtains/blackout",
      isPriceModified: false,
    },
  ]

  return items
} 