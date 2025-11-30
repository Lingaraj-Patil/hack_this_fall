export default function Loading({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-green-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  )
}
