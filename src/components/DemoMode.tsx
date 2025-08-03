import { useState } from 'react'
import { Play, RotateCcw, CheckCircle, Clock, Gift, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import toast from 'react-hot-toast'

export function DemoMode() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const demoSteps = [
    {
      title: 'Connect Demo Wallet',
      description: 'Connect to a simulated wallet with test tokens',
      action: 'Connect Demo Wallet',
      duration: 2000
    },
    {
      title: 'Get Test Tokens',
      description: 'Receive test XTZ, USDC, and WETH tokens from faucet',
      action: 'Claim Test Tokens',
      duration: 3000
    },
    {
      title: 'Create Dutch Auction',
      description: 'Set up a Dutch auction to swap XTZ for USDC',
      action: 'Create Auction',
      duration: 4000
    },
    {
      title: 'Monitor Auction',
      description: 'Watch the price decrease over time until filled',
      action: 'Watch Auction',
      duration: 5000
    },
    {
      title: 'Cross-Chain Bridge',
      description: 'Demonstrate bridging tokens from Ethereum to Etherlink',
      action: 'Bridge Tokens',
      duration: 6000
    },
    {
      title: 'View Analytics',
      description: 'Explore protocol analytics and trading metrics',
      action: 'View Analytics',
      duration: 2000
    }
  ]

  const executeStep = async (stepIndex: number) => {
    setIsRunning(true)
    setCurrentStep(stepIndex)
    
    const step = demoSteps[stepIndex]
    toast.loading(`${step.title}...`, { id: `step-${stepIndex}` })
    
    // Simulate step execution
    await new Promise(resolve => setTimeout(resolve, step.duration))
    
    setCompletedSteps(prev => [...prev, stepIndex])
    toast.success(`${step.title} completed!`, { id: `step-${stepIndex}` })
    
    if (stepIndex < demoSteps.length - 1) {
      setTimeout(() => executeStep(stepIndex + 1), 1000)
    } else {
      setIsRunning(false)
      toast.success('Demo completed! 🎉')
    }
  }

  const startDemo = () => {
    setCompletedSteps([])
    setCurrentStep(0)
    executeStep(0)
  }

  const resetDemo = () => {
    setCompletedSteps([])
    setCurrentStep(0)
    setIsRunning(false)
  }

  const getStepStatus = (index: number) => {
    if (completedSteps.includes(index)) return 'completed'
    if (currentStep === index && isRunning) return 'active'
    return 'pending'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'active':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Interactive Demo</h2>
        <p className="text-gray-600">Experience the full Etherlink Fusion+ workflow with simulated data</p>
      </div>

      {/* Demo Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This demo uses simulated data and transactions. No real funds or blockchain interactions occur.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demo Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Demo Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={startDemo}
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isRunning ? (
                  <>Running Demo...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetDemo}
                variant="outline"
                className="w-full"
                disabled={isRunning}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>

            {/* Demo Stats */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {completedSteps.length}/{demoSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps.length / demoSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Test Token Faucet */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Gift className="h-4 w-4 mr-2" />
                Test Token Faucet
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>XTZ</span>
                  <span className="font-medium">1000 XTZ</span>
                </div>
                <div className="flex justify-between">
                  <span>USDC</span>
                  <span className="font-medium">5000 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>WETH</span>
                  <span className="font-medium">2 WETH</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Steps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Demo Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoSteps.map((step, index) => {
                const status = getStepStatus(index)
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      status === 'active'
                        ? 'border-blue-500 bg-blue-50'
                        : status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStepIcon(status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">
                            Step {index + 1}: {step.title}
                          </h4>
                          <Badge
                            variant={status === 'completed' ? 'default' : 'outline'}
                            className={
                              status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : ''
                            }
                          >
                            {status === 'completed'
                              ? 'Completed'
                              : status === 'active'
                              ? 'Running'
                              : 'Pending'
                            }
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {step.description}
                        </p>
                        {status === 'active' && (
                          <div className="text-xs text-blue-600 font-medium">
                            Executing: {step.action}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Features */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="h-12 w-12 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium mb-1">Interactive Workflow</h4>
              <p className="text-sm text-gray-600">Step-by-step guided experience</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="h-12 w-12 bg-green-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium mb-1">Test Tokens</h4>
              <p className="text-sm text-gray-600">Simulated tokens for testing</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="h-12 w-12 bg-purple-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium mb-1">Real Features</h4>
              <p className="text-sm text-gray-600">All actual app functionality</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
