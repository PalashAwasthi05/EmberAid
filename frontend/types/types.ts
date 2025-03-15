export interface BoundingBox {
  x: number // Normalized (0-1) x-coordinate of top-left corner
  y: number // Normalized (0-1) y-coordinate of top-left corner
  width: number // Normalized (0-1) width of bounding box
  height: number // Normalized (0-1) height of bounding box
}

export interface ItemDetails {
  color?: string
  material?: string
  dimensions?: string
}

export interface DetectedItem {
  id: string
  label: string
  boundingBox: BoundingBox
  estimatedValue: number | null
  valueSource?: string
  sourceUrl?: string
  isPriceModified?: boolean
  details?: ItemDetails
}

