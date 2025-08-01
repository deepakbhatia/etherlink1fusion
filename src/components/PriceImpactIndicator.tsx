import { AlertTriangle, TrendingUp } from 'lucide-react'

interface PriceImpactIndicatorProps {
  impact: number // percentage
}

export function PriceImpactIndicator({ impact }: PriceImpactIndicatorProps) {
  const getImpactColor = (impact: number) => {
    if (impact < 0.5) return 'text-green-600'
    if (impact < 1) return 'text-yellow-600'
    if (impact < 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const getImpactBg = (impact: number) => {
    if (impact < 0.5) return 'bg-green-50'
    if (impact < 1) return 'bg-yellow-50'
    if (impact < 2) return 'bg-orange-50'
    return 'bg-red-50'
  }

  const getImpactIcon = (impact: number) => {
    if (impact >= 1) {
      return <AlertTriangle className="h-3 w-3" />
    }
    return <TrendingUp className="h-3 w-3" />
  }

  const getImpactText = (impact: number) => {
    if (impact < 0.1) return 'Minimal impact'
    if (impact < 0.5) return 'Low impact'
    if (impact < 1) return 'Moderate impact'
    if (impact < 2) return 'High impact'
    return 'Very high impact'
  }

  return (
    <div className={`flex items-center justify-between text-sm p-2 rounded ${getImpactBg(impact)}`}>
      <div className={`flex items-center space-x-1 ${getImpactColor(impact)}`}>
        {getImpactIcon(impact)}
        <span>Price Impact</span>
      </div>
      <div className={`flex items-center space-x-1 ${getImpactColor(impact)}`}>
        <span className="font-medium">{impact.toFixed(2)}%</span>
        <span className="text-xs">({getImpactText(impact)})</span>
      </div>
    </div>
  )
}
