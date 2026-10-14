import { useEffect, useState } from 'react'
import { StaggerContainer, StaggerItem } from './Motion'

function timeLeft(targetDate) {
  const diff = new Date(targetDate) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 864e5),
    hours: Math.floor((diff / 36e5) % 24),
    minutes: Math.floor((diff / 1e3 / 60) % 60),
    seconds: Math.floor((diff / 1e3) % 60),
  }
}

export default function CountdownTimer({ targetDate }) {
  const [time, setTime] = useState(() => timeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTime(timeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ]

  return (
    <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 mb-8 max-w-3xl mx-auto">
      {units.map(unit => (
        <StaggerItem key={unit.label}>
          <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center border-white/10 hover:border-primary/50 transition-colors duration-500">
            <div className="text-4xl md:text-6xl font-bold font-outfit text-white mb-2 tracking-tight shadow-primary/20 drop-shadow-lg">
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-medium">
              {unit.label}
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
