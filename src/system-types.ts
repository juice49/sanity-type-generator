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

export type ArrayMemberType<Member> = Member extends {
  _type: infer Type
}
  ? Type
  : string

export type ArrayMember<Member> = Member extends string | number | boolean
  ? Member
  : Member & {
      _key: string
      _type: ArrayMemberType<Member>
    }

export interface SanitySlug {
  _type: 'slug'

  /**
   * The current value of the slug.
   */
  current: string
}

export interface SanityGeopoint {
  _type: 'geopoint'

  /**
   * Latitude
   */
  lat: number | null

  /**
   * Longitude
   */
  lng: number | null

  /**
   * Altitude
   */
  alt: number | null
}

// export type PortableTextBlock = Record<string, unknown>
