"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  requireConsent?: boolean;
  className?: string;
}

/**
 * AudioPlayer Component - Requirements 8.2.2, 8.2.3
 * 
 * Plays background music for gallery with:
 * - Automatic playback with user consent
 * - Volume control and mute button
 * - Looping during gallery viewing
 * - Consent dialog for GDPR compliance
 */
export function AudioPlayer({ 
  audioUrl, 
  autoPlay = true,
  requireConsent = true,
  className = ""
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showConsent, setShowConsent] = useState(requireConsent && autoPlay);
  const [hasConsent, setHasConsent] = useState(!requireConsent);
  const [hasError, setHasError] = useState(false);

  // Handle consent and auto-play - Requirement 8.2.2
  useEffect(() => {
    if (!hasConsent || !autoPlay) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Attempt to play after consent
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Audio autoplay failed:", error);
          // Autoplay might be blocked, user will need to click play
        });
    }
  }, [hasConsent, autoPlay]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleConsent = (accepted: boolean) => {
    setShowConsent(false);
    setHasConsent(accepted);
    
    if (accepted && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Unmute if volume is increased from 0
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  };

  const handleError = () => {
    setHasError(true);
    console.error("Failed to load audio:", audioUrl);
  };

  if (hasError) {
    return null;
  }

  return (
    <>
      {/* Audio Element - Requirements 8.2.2, 8.2.3 */}
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="auto"
        onError={handleError}
        aria-label="Musique d'ambiance de la galerie"
      />

      {/* Consent Dialog - Requirement 8.2.2 */}
      {showConsent && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Music size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Musique d'ambiance
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Cette galerie contient une musique d'ambiance. Souhaitez-vous l'activer pour une expérience immersive ?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleConsent(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                Non merci
              </button>
              <button
                onClick={() => handleConsent(true)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Activer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Controls - Requirement 8.2.3 */}
      {hasConsent && !showConsent && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full shadow-lg ${className}`}>
          {/* Music Icon */}
          <div className="flex items-center gap-2">
            <Music size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
              Musique
            </span>
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-slate-700 dark:text-slate-300">
                <rect x="2" y="2" width="3" height="10" rx="1" />
                <rect x="9" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-slate-700 dark:text-slate-300">
                <path d="M3 2.5C3 2.22386 3.22386 2 3.5 2C3.63261 2 3.75979 2.05268 3.85355 2.14645L11.8536 10.1464C12.0488 10.3417 12.0488 10.6583 11.8536 10.8536C11.6583 11.0488 11.3417 11.0488 11.1464 10.8536L3.14645 2.85355C3.05268 2.75979 3 2.63261 3 2.5Z" />
              </svg>
            )}
          </button>

          {/* Volume Slider */}
          <div className="hidden sm:flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer"
              aria-label="Volume"
            />
          </div>

          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={16} className="text-slate-700 dark:text-slate-300" />
            ) : (
              <Volume2 size={16} className="text-slate-700 dark:text-slate-300" />
            )}
          </button>
        </div>
      )}
    </>
  );
}
