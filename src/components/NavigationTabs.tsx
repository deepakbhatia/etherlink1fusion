import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { SwapInterface } from './SwapInterface'
import { OrderManagement } from './OrderManagement'
import { CrossChainBridge } from './CrossChainBridge'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { DemoMode } from './DemoMode'
import { ArrowLeftRight, ListOrdered, ArrowRightLeft, BarChart3, Play } from 'lucide-react'

export function NavigationTabs() {
  return (
    <Tabs defaultValue="swap" className="w-full">
      <div className="border-b border-gray-200 mb-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-50/50">
          <TabsTrigger value="swap" className="flex items-center space-x-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Swap</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ListOrdered className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="bridge" className="flex items-center space-x-2">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bridge</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Demo</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="swap" className="mt-0">
        <SwapInterface />
      </TabsContent>

      <TabsContent value="orders" className="mt-0">
        <OrderManagement />
      </TabsContent>

      <TabsContent value="bridge" className="mt-0">
        <CrossChainBridge />
      </TabsContent>

      <TabsContent value="analytics" className="mt-0">
        <AnalyticsDashboard />
      </TabsContent>

      <TabsContent value="demo" className="mt-0">
        <DemoMode />
      </TabsContent>
    </Tabs>
  )
}
