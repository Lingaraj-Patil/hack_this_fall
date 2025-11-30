export default function FocusHeatmap() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const generateHeatmapData = () => {
    const data = []
    for (let i = 0; i < 365; i++) {
      data.push(Math.random())
    }
    return data
  }

  const heatmapData = generateHeatmapData()

  return (
    <div className="glass rounded-2xl p-6 w-full">
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        {months.map((month) => (
          <span key={month} className="text-white/60">{month}</span>
        ))}
      </div>
      
      <div className="grid grid-cols-52 gap-1">
        {heatmapData.map((value, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-sm"
            style={{
              backgroundColor: value > 0.7 
                ? '#22c55e' 
                : value > 0.4 
                ? '#86efac' 
                : value > 0.2 
                ? '#d1fae5' 
                : 'rgba(255,255,255,0.1)'
            }}
          />
        ))}
      </div>

      <p className="text-white/80 text-center mt-4 font-medium">
        Today's Focus Time: <span className="text-green-400">4h</span>
      </p>
    </div>
  )
}