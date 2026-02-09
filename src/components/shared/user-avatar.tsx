import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  /**
   * User's name for fallback initials
   */
  name: string;
  
  /**
   * Avatar image URL (optional)
   */
  src?: string | null;
  
  /**
   * Size of the avatar
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Alt text for the image (defaults to name)
   */
  alt?: string;
  
  /**
   * Whether to show a border
   * @default false
   */
  showBorder?: boolean;
  
  /**
   * Border color
   * @default "white"
   */
  borderColor?: "white" | "slate";
  
  /**
   * Avatar shape variant
   * @default "circle"
   */
  variant?: "circle" | "rounded";
}

const sizeConfig = {
  xs: {
    container: "w-6 h-6",
    text: "text-[10px]",
    image: 24,
  },
  sm: {
    container: "w-8 h-8",
    text: "text-xs",
    image: 32,
  },
  md: {
    container: "w-9 h-9",
    text: "text-sm",
    image: 36,
  },
  lg: {
    container: "w-10 h-10",
    text: "text-base",
    image: 40,
  },
  xl: {
    container: "w-12 h-12",
    text: "text-lg",
    image: 48,
  },
  "2xl": {
    container: "w-16 h-16",
    text: "text-2xl",
    image: 64,
  },
};

/**
 * UserAvatar Component
 * 
 * Optimized, accessible avatar component that displays:
 * - User's profile image if available
 * - Fallback to initials with gradient background
 * - Proper accessibility attributes
 * - Next.js Image optimization
 * 
 * Features:
 * - Multiple size variants
 * - Automatic initials generation
 * - PikSend gradient background for fallback
 * - Optimized image loading with Next.js Image
 * - Accessible alt text
 * - Optional border
 * 
 * @example
 * ```tsx
 * // With image
 * <UserAvatar name="John Doe" src="/avatars/john.jpg" size="md" />
 * 
 * // Fallback to initials
 * <UserAvatar name="Jane Smith" size="lg" />
 * 
 * // With border
 * <UserAvatar name="Admin User" showBorder borderColor="white" />
 * ```
 */
export function UserAvatar({
  name,
  src,
  size = "md",
  className,
  alt,
  showBorder = false,
  borderColor = "white",
  variant = "circle",
}: UserAvatarProps) {
  const config = sizeConfig[size];
  
  // Generate initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "?";
    }
    if (parts.length === 1) {
      return parts[0]!.charAt(0).toUpperCase();
    }
    const firstInitial = parts[0]!.charAt(0);
    const lastInitial = parts[parts.length - 1]!.charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };
  
  const initials = getInitials(name);
  const altText = alt || name;
  
  const borderClasses = showBorder
    ? borderColor === "white"
      ? "border-2 border-white"
      : "border-2 border-slate-200"
    : "";

  const shapeClasses = variant === "circle" 
    ? "rounded-full" 
    : "rounded-xl lg:rounded-2xl";

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden flex-shrink-0",
        config.container,
        shapeClasses,
        borderClasses,
        src ? "bg-slate-100" : "bg-piksend-gradient",
        className
      )}
      role="img"
      aria-label={altText}
    >
      {src ? (
        <Image
          src={src}
          alt={altText}
          width={config.image}
          height={config.image}
          className="w-full h-full object-cover"
          priority={size === "lg" || size === "xl" || size === "2xl"}
          quality={85}
          sizes={`${config.image}px`}
        />
      ) : (
        <span
          className={cn(
            "font-bold text-white select-none",
            config.text
          )}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
}
