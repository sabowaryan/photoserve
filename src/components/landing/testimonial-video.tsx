/**
 * Testimonial Video Component
 * Video testimonial with author metadata and metrics
 * 
 * @module components/landing/testimonial-video
 * Requirements: 4.3
 */

'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { Persona } from '@/types/persona';

export interface TestimonialAuthor {
  name: string;
  role: string;
  location: string;
  photo: string;
  persona: Persona;
}

export interface TestimonialMetrics {
  revenue?: string;
  timeSaved?: string;
  roi?: string;
  customMetric?: {
    label: string;
    value: string;
  };
}

export interface TestimonialVideoProps {
  videoUrl: string;
  thumbnail: string;
  author: TestimonialAuthor;
  quote: string;
  metrics?: TestimonialMetrics;
  variant?: 'card' | 'inline' | 'featured';
}

export function TestimonialVideo({
  videoUrl,
  thumbnail,
  author,
  quote,
  metrics,
  variant = 'card',
}: TestimonialVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlay = () => {
    if (variant === 'featured') {
      setIsModalOpen(true);
    }
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {/* Video */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-1/2">
          {!isPlaying ? (
            <>
              <Image
                src={thumbnail}
                alt={`Témoignage de ${author.name}`}
                fill
                className="object-cover"
                loading="lazy"
              />
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all hover:bg-black/40"
                aria-label="Lire la vidéo"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110">
                  <Play className="h-8 w-8 text-blue-600" fill="currentColor" />
                </div>
              </button>
            </>
          ) : (
            <iframe
              src={`${videoUrl}?autoplay=1`}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={`Témoignage de ${author.name}`}
            />
          )}
        </div>

        {/* Content */}
        <div className="md:w-1/2">
          <blockquote className="mb-4 text-lg italic text-gray-700">
            "{quote}"
          </blockquote>
          <div className="flex items-center gap-3">
            <Image
              src={author.photo}
              alt={author.name}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold text-gray-900">{author.name}</p>
              <p className="text-sm text-gray-600">
                {author.role} • {author.location}
              </p>
            </div>
          </div>
          {metrics && (
            <div className="mt-4 flex flex-wrap gap-3">
              {metrics.revenue && (
                <Badge variant="secondary">💰 {metrics.revenue}</Badge>
              )}
              {metrics.timeSaved && (
                <Badge variant="secondary">⏱️ {metrics.timeSaved}</Badge>
              )}
              {metrics.roi && (
                <Badge variant="secondary">📈 {metrics.roi}</Badge>
              )}
              {metrics.customMetric && (
                <Badge variant="secondary">
                  {metrics.customMetric.label}: {metrics.customMetric.value}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <>
        {/* Featured Card */}
        <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Image
                src={author.photo}
                alt={author.name}
                width={56}
                height={56}
                className="rounded-full"
              />
              <div>
                <p className="font-bold text-gray-900">{author.name}</p>
                <p className="text-sm text-gray-600">
                  {author.role} • {author.location}
                </p>
              </div>
            </div>

            <blockquote className="mb-4 text-lg font-medium italic text-gray-800">
              "{quote}"
            </blockquote>

            {metrics && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.revenue && (
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{metrics.revenue}</p>
                    <p className="text-xs text-gray-600">Revenus</p>
                  </div>
                )}
                {metrics.timeSaved && (
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-green-600">{metrics.timeSaved}</p>
                    <p className="text-xs text-gray-600">Temps gagné</p>
                  </div>
                )}
                {metrics.roi && (
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-purple-600">{metrics.roi}</p>
                    <p className="text-xs text-gray-600">ROI</p>
                  </div>
                )}
                {metrics.customMetric && (
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics.customMetric.value}
                    </p>
                    <p className="text-xs text-gray-600">{metrics.customMetric.label}</p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handlePlay} className="w-full" size="lg">
              <Play className="mr-2 h-5 w-5" />
              Voir le témoignage vidéo
            </Button>
          </CardContent>
        </Card>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={handleClose}
                className="absolute -right-4 -top-4 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={`${videoUrl}?autoplay=1`}
                  className="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={`Témoignage de ${author.name}`}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default: card variant
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Video thumbnail */}
        <div className="relative aspect-video w-full">
          {!isPlaying ? (
            <>
              <Image
                src={thumbnail}
                alt={`Témoignage de ${author.name}`}
                fill
                className="object-cover"
                loading="lazy"
              />
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all hover:bg-black/40"
                aria-label="Lire la vidéo"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110">
                  <Play className="h-8 w-8 text-blue-600" fill="currentColor" />
                </div>
              </button>
            </>
          ) : (
            <iframe
              src={`${videoUrl}?autoplay=1`}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={`Témoignage de ${author.name}`}
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <blockquote className="mb-3 text-sm italic text-gray-700">
            "{quote}"
          </blockquote>
          <div className="flex items-center gap-3">
            <Image
              src={author.photo}
              alt={author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">{author.name}</p>
              <p className="text-xs text-gray-600">
                {author.role} • {author.location}
              </p>
            </div>
          </div>
          {metrics && (
            <div className="mt-3 flex flex-wrap gap-2">
              {metrics.revenue && (
                <Badge variant="secondary" className="text-xs">
                  💰 {metrics.revenue}
                </Badge>
              )}
              {metrics.timeSaved && (
                <Badge variant="secondary" className="text-xs">
                  ⏱️ {metrics.timeSaved}
                </Badge>
              )}
              {metrics.roi && (
                <Badge variant="secondary" className="text-xs">
                  📈 {metrics.roi}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
