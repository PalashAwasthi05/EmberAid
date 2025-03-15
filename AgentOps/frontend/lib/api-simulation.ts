import type { DetectedItem } from "@/types/types"

// Simulate object detection API call
export async function simulateObjectDetection(imageDataUrl: string): Promise<DetectedItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500))

  // Generate random items based on the image
  // In a real app, this would be an API call to a backend service
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
        x: 0.05,
        y: 0.1,
        width: 0.15,
        height: 0.4,
      },
      estimatedValue: null,
      valueSource: undefined,
      sourceUrl: undefined,
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

