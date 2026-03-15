import { groq } from 'next-sanity'

// Hearings
export const allHearingsQuery = groq`
  *[_type == "hearing"] | order(_createdAt desc) {
    _id,
    _createdAt,
    _updatedAt,
    clientName,
    clientSlug,
    productName,
    status,
    templateTier,
    linkedLp->{
      _id,
      title,
      slug,
      publishStatus
    }
  }
`

export const hearingByIdQuery = groq`
  *[_type == "hearing" && _id == $id][0] {
    _id,
    _createdAt,
    _updatedAt,
    clientName,
    clientSlug,
    contactPerson,
    contactEmail,
    productName,
    productDescription,
    uniqueSellingPoints,
    priceInfo,
    targetAudience,
    painPoints,
    desiredOutcome,
    templateTier,
    primaryColor,
    secondaryColor,
    accentColor,
    referenceUrls,
    logoImage,
    brandAssets,
    status,
    linkedLp->{
      _id,
      title,
      slug,
      publishStatus
    },
    notes
  }
`

// LPs
export const allLpsQuery = groq`
  *[_type == "lp"] | order(_createdAt desc) {
    _id,
    _createdAt,
    _updatedAt,
    title,
    slug,
    clientSlug,
    templateTier,
    publishStatus,
    publishedAt,
    hearing->{
      _id,
      clientName
    }
  }
`

export const lpBySlugQuery = groq`
  *[_type == "lp" && slug.current == $slug && clientSlug == $clientSlug][0] {
    _id,
    title,
    slug,
    clientSlug,
    templateTier,
    pageBuilder[] {
      _type,
      _key,
      ...,
      backgroundImage {
        asset->{
          _id,
          url
        }
      },
      features[] {
        ...,
        image {
          asset->{
            _id,
            url
          }
        }
      }
    },
    primaryColor,
    secondaryColor,
    accentColor,
    seoTitle,
    seoDescription,
    ogImage,
    publishStatus,
    publishedAt
  }
`

export const lpByIdQuery = groq`
  *[_type == "lp" && _id == $id][0] {
    _id,
    title,
    slug,
    clientSlug,
    templateTier,
    pageBuilder[] {
      _type,
      _key,
      ...,
      backgroundImage {
        asset->{
          _id,
          url
        }
      },
      features[] {
        ...,
        image {
          asset->{
            _id,
            url
          }
        }
      }
    },
    primaryColor,
    secondaryColor,
    accentColor,
    seoTitle,
    seoDescription,
    ogImage,
    publishStatus,
    publishedAt,
    hearing->{
      _id,
      clientName,
      productName
    }
  }
`

// Templates
export const allTemplatesQuery = groq`
  *[_type == "template"] | order(tier asc) {
    _id,
    name,
    tier,
    description,
    thumbnail,
    availableBlocks,
    defaultBlockTypes
  }
`

export const templateByTierQuery = groq`
  *[_type == "template" && tier == $tier][0] {
    _id,
    name,
    tier,
    availableBlocks,
    defaultBlockTypes
  }
`
