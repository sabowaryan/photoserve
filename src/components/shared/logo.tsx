import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'gradient' | 'white' | 'monochrome';
}

export function Logo({ className = "", size = 24, variant = 'gradient' }: LogoProps) {
  // Déterminer le fichier SVG selon la variante
  const logoSrc = variant === 'white' || variant === 'monochrome' 
    ? '/icons/logo-white.svg' 
    : '/icons/logo-gradient.svg';
  
  // Ratio du logo: 430.08 / 349.24
  const aspectRatio = 430.08 / 349.24;
  const height = size / aspectRatio;

  return (
    <Image
      src={logoSrc}
      alt="PikSend Logo"
      width={size}
      height={height}
      className={className}
      unoptimized // SVG n'a pas besoin d'optimisation
      priority // Logo est critique pour LCP
    />
  );
}

export function LogoIcon({ className = "", size = 24, variant = 'gradient' }: LogoProps) {
  return (
    <Logo size={size} className={className} variant={variant} />
  );
}
