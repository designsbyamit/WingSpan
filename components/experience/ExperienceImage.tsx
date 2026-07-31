'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ExperienceImageProps {
  experienceId: string
  title: string
}

export function ExperienceImage({ experienceId, title }: ExperienceImageProps) {
  const [image, setImage] = useState<{ url: string; attribution: string; attributionLink?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/experience-image?id=${experienceId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.url) setImage(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [experienceId])

  if (loading) {
    return (
      <div className="w-full h-56 rounded-2xl bg-[#2D3139] animate-pulse" />
    )
  }

  if (!image) return null

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden group">
      <Image
        src={image.url}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 672px"
        priority
      />
      {/* Lime gradient overlay — keeps text readable, on-brand */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#23262F]/90 via-[#23262F]/20 to-transparent" />
      {/* Attribution */}
      <a
        href={image.attributionLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 text-[10px] text-white/40 hover:text-white/70 transition-colors"
      >
        {image.attribution}
      </a>
    </div>
  )
}
