import React from 'react'
import { Badge } from './badge'

interface CompactPageHeaderProps {
  badge?: string
  title: string
  subtitle?: string
  className?: string
}

export const CompactPageHeader: React.FC<CompactPageHeaderProps> = ({
  badge,
  title,
  subtitle,
  className = ""
}) => {
  return (
    <div className={`text-center ${className}`}>
      {badge && (
        <Badge variant="secondary" className="mb-3 bg-primary-50 text-primary-700 border-primary-200">
          {badge}
        </Badge>
      )}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
      {subtitle && (
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}
