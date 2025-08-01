import { useState, useEffect } from 'react'
import { Clock, TrendingDown } from 'lucide-react'
import { Progress } from './ui/progress'

interface DutchAuctionTimerProps {
  startPrice: number
  endPrice: number
  duration: number // in seconds
}

export function DutchAuctionTimer({ startPrice, endPrice, duration }: DutchAuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      setIsActive(false)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, isActive])

  const progress = ((duration - timeLeft) / duration) * 100
  const currentPrice = startPrice - ((startPrice - endPrice) * progress / 100)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-blue-600">
          <Clock className="h-3 w-3" />
          <span>Dutch Auction</span>
        </div>
        <span className="font-mono font-medium">
          {isActive ? formatTime(timeLeft) : 'Ended'}
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-gray-500">
          <TrendingDown className="h-3 w-3" />
          <span>Current Price</span>
        </div>
        <span className="font-medium">
          {currentPrice.toFixed(6)}
        </span>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>Start: {startPrice.toFixed(6)}</span>
        <span>End: {endPrice.toFixed(6)}</span>
      </div>
    </div>
  )
}
