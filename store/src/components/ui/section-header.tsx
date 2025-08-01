import React from 'react'

interface SectionHeaderProps {
  badge?: string
  title: string
  subtitle?: string
  className?: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  subtitle,
  className = ""
}) => {
  return (
    <div className={`text-center mb-16 ${className}`}>
      <div className="inline-block">
        {badge && (
          <span className="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-2 block">
            {badge}
          </span>
        )}
        <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight text-neutral-900" style={{
          background: 'linear-gradient(to right, #171717, #3b82f6, #d946ef)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-600 mx-auto rounded-full"></div>
      </div>
      {subtitle && (
        <p className="text-neutral-600 text-md mt-6 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default SectionHeader
