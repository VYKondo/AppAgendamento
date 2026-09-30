import { C } from '@/styles/palette'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
}

export default function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular' 
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    backgroundColor: '#f3f4f6',
    borderRadius: variant === 'circular' ? '9999px' : '0.75rem',
  }

  return (
    <div 
      className={`animate-pulse ${className}`} 
      style={style}
      aria-hidden="true"
    />
  )
}
