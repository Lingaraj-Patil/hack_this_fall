import { cn } from '../../utils/cn'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
    ghost: 'hover:bg-gray-100 text-gray-700',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
