import { PortableTextBlock } from 'sanity'

export interface SanityDocument {
  _id: string
  _rev: string
  _createdAt: string
  _updatedAt: string
}

export interface SanityReference<Type extends SanityDocument> {
  _type: 'reference'
  _ref: string
  _weak?: boolean
}

export interface SanityCrossDatasetReference extends SanityReference<never> {
  _dataset: string
}

export interface SanityImage {
  _type: 'image'
  asset: SanityReference<SanityImageAsset>
  crop?: SanityImageCrop
  hotspot?: SanityImageHotspot
}

// export type PortableTextBlock = Record<string, unknown>
