import { Calendar, Dumbbell, BookOpen } from 'lucide-react'

export default function WhatsNext() {
  const events = [
    {
      id: 1,
      date: 'MON\n9',
      title: 'Lesson',
      time: '17:00 - 18:15',
      icon: BookOpen,
      color: 'text-blue-400'
    },
    {
      id: 2,
      date: 'MON\n9',
      title: 'Gym',
      time: '18:15 - 19:45',
      icon: Dumbbell,
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">What's Next</h2>
      
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div className="text-center">
              <div className="text-white font-bold text-2xl leading-tight whitespace-pre-line">
                {event.date}
              </div>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <event.icon className={`w-4 h-4 ${event.color}`} />
                <h3 className="text-white font-medium">{event.title}</h3>
              </div>
              <p className="text-white/60 text-sm">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
