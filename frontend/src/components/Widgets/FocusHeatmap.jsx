import { useMemo, useState, useEffect } from 'react'
import { sessionAPI } from '../../api/session'

export default function FocusHeatmap({ data = null }) {
  const [todayFocusTime, setTodayFocusTime] = useState(0)
  
  useEffect(() => {
    // Fetch today's focus time
    const fetchTodayStats = async () => {
      try {
        const res = await sessionAPI.getStats({ period: 'today' })
        const stats = res.data.data
        // Total time in seconds, convert to hours
        const hours = Math.floor((stats?.totalTime || 0) / 3600)
        const minutes = Math.floor(((stats?.totalTime || 0) % 3600) / 60)
        setTodayFocusTime(stats?.totalTime || 0)
      } catch (err) {
        console.error('Failed to fetch today stats:', err)
      }
    }
    fetchTodayStats()
    // Refresh every minute
    const interval = setInterval(fetchTodayStats, 60000)
    return () => clearInterval(interval)
  }, [])
  
  const formatTodayFocusTime = () => {
    if (todayFocusTime === 0) return '0m'
    const hours = Math.floor(todayFocusTime / 3600)
    const minutes = Math.floor((todayFocusTime % 3600) / 60)
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
    }
    return `${minutes}m`
  }
  // months label for top
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // If the parent doesn't provide real data, generate a stable dataset once (memoized)
  // The heatmap is arranged in weeks (52 columns) x 7 days per week to mimic a contribution graph.
  const weeks = useMemo(() => {
    // prefer using provided data (array of {date, value} or numbers indexed by day)
    if (Array.isArray(data) && data.length > 0) {
      // expect data length ~365, map into weeks
      const items = data.slice(0, 365)
      const weekCols = Array.from({ length: 52 }, () => [])
      items.forEach((val, idx) => {
        const week = Math.floor(idx / 7)
        weekCols[week] = weekCols[week] || []
        weekCols[week].push(typeof val === 'number' ? val : (val.value ?? 0))
      })
      return weekCols
    }

    // deterministic pseudo-random generator (seeded by fixed value) so UI doesn't move
    let seed = 1337
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    const weekCols = Array.from({ length: 52 }, () => Array.from({ length: 7 }, () => rnd()))
    // Trim to 365 days (last week may have fewer than 7 days)
    return weekCols
  }, [data])

  // helper to convert value to color
  const colorFor = (v) => {
    if (v > 0.8) return 'var(--accent-600)'
    if (v > 0.6) return 'var(--accent)'
    if (v > 0.35) return 'var(--accent-muted)'
    if (v > 0.15) return 'rgba(34,197,94,0.12)'
    return 'rgba(255,255,255,0.06)'
  }

  return (
    <div className="glass rounded-2xl p-6 w-full">
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        {months.map((month) => (
          <span key={month} className="text-white/60">{month}</span>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto" style={{ paddingBottom: 6 }}>
        {weeks.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((value, ri) => (
              <div
                key={ri}
                className="w-2 h-2 rounded-sm"
                title={`Week ${ci + 1} day ${ri + 1}`}
                style={{ backgroundColor: colorFor(value) }}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="text-white/80 text-center mt-4 font-medium">
        Today's Focus Time: <span className="text-green-400">{formatTodayFocusTime()}</span>
      </p>
    </div>
  )
}