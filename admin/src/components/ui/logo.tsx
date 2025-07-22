"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  showText?: boolean
  text?: string
  lightSrc?: string
  darkSrc?: string
  fallbackIcon?: React.ComponentType<{ className?: string }>
}

export function Logo({ 
  size = 32, 
  showText = false, 
  text = "Zyvo",
  lightSrc = "/images/logo-light.png",
  darkSrc = "/images/logo-dark.png",
  fallbackIcon: FallbackIcon,
  className,
  ...props 
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme
  const logoSrc = React.useMemo(() => {
    if (!mounted) return lightSrc // Default to light during SSR
    
    const currentTheme = resolvedTheme || theme
    return currentTheme === 'dark' ? darkSrc : lightSrc
  }, [mounted, resolvedTheme, theme, lightSrc, darkSrc])

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div 
      className={cn("flex items-center gap-2", className)} 
      {...props}
    >
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {!imageError ? (
          <Image
            src={logoSrc}
            alt={`${text} Logo`}
            width={size}
            height={size}
            className="object-contain"
            onError={handleImageError}
            priority
          />
        ) : FallbackIcon ? (
          <FallbackIcon className={cn("text-primary", `w-${Math.floor(size/4)} h-${Math.floor(size/4)}`)} />
        ) : (
          <div 
            className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg font-bold text-xs"
            style={{ width: size, height: size }}
          >
            {text?.charAt(0) || "L"}
          </div>
        )}
      </div>
      
      {showText && (
        <span className="font-semibold text-sm leading-tight">
          {text}
        </span>
      )}
    </div>
  )
}

// Preset variations
export function LogoSmall(props: Omit<LogoProps, 'size'>) {
  return <Logo size={24} {...props} />
}

export function LogoMedium(props: Omit<LogoProps, 'size'>) {
  return <Logo size={32} {...props} />
}

export function LogoLarge(props: Omit<LogoProps, 'size'>) {
  return <Logo size={48} {...props} />
}

export function LogoWithText(props: Omit<LogoProps, 'showText'>) {
  return <Logo showText={true} {...props} />
}
