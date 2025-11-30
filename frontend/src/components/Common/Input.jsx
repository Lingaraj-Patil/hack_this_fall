import { cn } from '../../utils/cn'

export default function Input({ className, error, ...props }) {
  return (
    <div>
      <input
        className={cn(
          'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}