"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface VideoCoverProps {
  videoUrl: string;
  className?: string;
  showControls?: boolean;
}

/**
 * VideoCover Component - Requirements 8.1.2, 8.1.3
 * 
 * Displays a video background for gallery with:
 * - Automatic playback (muted by default)
 * - Seamless looping
 * - Optional mute/unmute controls
 * - Max 30 seconds, 1080p (enforced at upload)
 */
export function VideoCover({ 
  videoUrl, 
  className = "",
  showControls = true
}: VideoCoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Auto-play when component mounts - Requirement 8.1.2
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt to play the video
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsLoaded(true);
        })
        .catch((error) => {
          console.error("Video autoplay failed:", error);
          // Autoplay might be blocked by browser policy
          // Video will still be visible but not playing
        });
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleError = () => {
    setHasError(true);
    console.error("Failed to load video:", videoUrl);
  };

  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  if (hasError) {
    return null;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Video Element - Requirements 8.1.2, 8.1.3 */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={videoUrl}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        onError={handleError}
        onLoadedData={handleLoadedData}
        aria-label="Vidéo de couverture de la galerie"
      />

      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse" />
      )}

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 pointer-events-none" />

      {/* Mute/Unmute Control - Optional */}
      {showControls && isLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all shadow-lg"
          aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
        >
          {isMuted ? (
            <VolumeX size={20} className="text-white" />
          ) : (
            <Volume2 size={20} className="text-white" />
          )}
        </button>
      )}
    </div>
  );
}
