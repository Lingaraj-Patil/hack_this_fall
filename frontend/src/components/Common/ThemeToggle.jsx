import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

export default function ThemeToggle({ inline = false }) {
  const { theme, toggleTheme } = useContext(ThemeContext)

  const btnClass = inline
    ? 'glass w-9 h-9 rounded-full flex items-center justify-center'
    : 'glass w-10 h-10 rounded-full flex items-center justify-center'

  const wrapperClass = inline ? 'inline-flex' : 'fixed top-4 right-4 z-50'

  return (
    <div className={wrapperClass}>
      <button
        onClick={toggleTheme}
        className={btnClass}
        title="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36l-1.42-1.42M7.05 6.05L5.64 4.64m12.02 0l-1.41 1.41M7.05 17.95l-1.41 1.41"></path></svg>
        )}
      </button>
    </div>
  )
}
