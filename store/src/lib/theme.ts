// Theme configuration with primary, secondary, and accent colors
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main primary color
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // Main secondary color
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Main accent color
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  gradients: {
    primary: 'from-primary-600 via-primary-500 to-primary-700',
    secondary: 'from-secondary-600 via-secondary-500 to-secondary-700',
    accent: 'from-accent-600 via-accent-500 to-accent-700',
    hero: 'from-primary-900 via-primary-600 to-secondary-800',
    card: 'from-neutral-50 to-neutral-100',
    overlay: 'from-black/80 via-black/20 to-transparent',
  },
  shadows: {
    primary: 'shadow-primary-500/25',
    secondary: 'shadow-secondary-500/25',
    accent: 'shadow-accent-500/25',
  }
}

// CSS custom properties for runtime theming
export const themeVariables = `
:root {
  --color-primary: ${theme.colors.primary[500]};
  --color-primary-hover: ${theme.colors.primary[600]};
  --color-secondary: ${theme.colors.secondary[500]};
  --color-secondary-hover: ${theme.colors.secondary[600]};
  --color-accent: ${theme.colors.accent[500]};
  --color-accent-hover: ${theme.colors.accent[600]};
  --color-neutral: ${theme.colors.neutral[500]};
  --color-neutral-dark: ${theme.colors.neutral[800]};
}
`

// Utility functions for theme colors
export const getThemeColor = (colorName: keyof typeof theme.colors, shade: keyof typeof theme.colors.primary = 500) => {
  return theme.colors[colorName][shade]
}

export const getGradient = (gradientName: keyof typeof theme.gradients) => {
  return `bg-gradient-to-r ${theme.gradients[gradientName]}`
}

export default theme
