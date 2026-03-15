'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 flex items-center justify-center ${className ?? ''}`}>
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!src || hasError) {
    return <ImagePlaceholder className={fill ? 'absolute inset-0 w-full h-full' : className} />
  }

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit]

  return (
    <div className={`relative ${fill ? '' : 'inline-block'} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (width ?? 400)}
        height={fill ? undefined : (height ?? 300)}
        fill={fill}
        priority={priority}
        sizes={sizes ?? (fill ? '100vw' : undefined)}
        className={`${objectFitClass} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

export function SanityImage({
  image,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  objectFit = 'cover',
}: {
  image?: { asset?: { _ref?: string; url?: string } }
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}) {
  if (!image?.asset) {
    return <ImagePlaceholder className={fill ? 'absolute inset-0 w-full h-full' : className} />
  }

  let imageUrl = ''
  if (image.asset.url) {
    imageUrl = image.asset.url
  } else if (image.asset._ref) {
    const ref = image.asset._ref
    const [, id, dimensions, format] = ref.split('-')
    imageUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'PROJECT_ID'}/${process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'}/${id}-${dimensions}.${format}`
  }

  if (!imageUrl) {
    return <ImagePlaceholder className={fill ? 'absolute inset-0 w-full h-full' : className} />
  }

  return (
    <OptimizedImage
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
      objectFit={objectFit}
    />
  )
}
