'use client'

import React, { useState, lazy, Suspense, memo, useCallback } from 'react'
import { 
  Zap, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Settings,
  Menu,
  X,
  Crown,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Lazy-loaded components
const InputMethodTabs = lazy(() => import('@/components/magic-input/InputMethodTabs'))
const SupportChat = lazy(() => import('@/components/support/SupportChat').then(mod => ({ default: mod.SupportChat })))
const LanguageSwitcher = lazy(() => import('@/components/LanguageSwitcher').then(mod => ({ default: mod.LanguageSwitcher })))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)
// Mock user data (replace with real data)
const mockUser = {
  id: 'user_123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '',
  plan: 'pro' as const,
  currentUsage: 15,
  planLimit: 500,
  recentGenerations: [
    { id: '1', productName: 'Wireless Headphones', platform: 'Amazon', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '2', productName: 'Smart Watch', platform: 'Shopify', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', productName: 'Gaming Mouse', platform: 'eBay', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) }
  ]
}

const sidebarItems = [
  { id: 'generator', label: 'Generator', icon: Zap, active: true },
  { id: 'history', label: 'History', icon: FileText, active: false },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, active: false },
  { id: 'trending', label: 'Trending', icon: TrendingUp, active: false },
  { id: 'competitors', label: 'Competitors', icon: Users, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, active: false }
]

const quickTips = [
  "CSV files auto-detect your platform for better optimization",
  "Universal platform is always free - additional platforms cost 0.5 generations",
  "URL Intelligence analyzes competitors to create superior content",
  "Export formats preserve ALL original columns + add CopyFlow_ enhancements"
]

const platformStatus = [
  { name: 'Amazon', status: 'operational', uptime: '99.9%' },
  { name: 'Shopify', status: 'operational', uptime: '99.8%' },
  { name: 'eBay', status: 'maintenance', uptime: '98.5%' },
  { name: 'Etsy', status: 'operational', uptime: '99.7%' }
]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('generator')

  const usagePercentage = (mockUser.currentUsage / mockUser.planLimit) * 100
  
  // Memoized handlers
  const handleGenerationComplete = useCallback((response: any, method: string) => {
    console.log('Generation completed:', { response, method })
    // Handle successful generation
  }, [])

  const handleUsageUpdate = useCallback((newUsage: number) => {
    console.log('Usage updated:', newUsage)
    // Update user usage
  }, [])

  // Memoized utility functions
  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }, [])

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className={cn(
        'bg-card border-r transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg">CopyFlow</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    item.active || activeTab === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Generator</h1>
              <Badge variant="outline" className="text-xs">
                Phase 1A
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Usage Indicator */}
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  <span className="font-medium">{mockUser.currentUsage}</span>
                  <span className="text-muted-foreground">/{mockUser.planLimit}</span>
                </div>
                <Progress value={usagePercentage} className="w-20 h-2" />
              </div>

              {/* Plan Indicator */}
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium capitalize">{mockUser.plan}</span>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher variant="compact" />

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={mockUser.avatar} />
                  <AvatarFallback>
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{mockUser.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className={cn(
            'flex-1 p-6 transition-all duration-300',
            rightPanelOpen ? 'mr-80' : 'mr-0'
          )}>
            {activeTab === 'generator' && (
              <div className="space-y-6">
                {/* Hero Section */}
                <div className="text-center space-y-4 py-8">
                  <h2 className="text-3xl font-bold">
                    Transform Your Platform Exports Into Super-Exports
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Upload your CSV, analyze competitors, or enhance single products. 
                    Get back enhanced files with CopyFlow_ columns that seamlessly import back to your platform.
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>98% import success rate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Original columns preserved</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Platform-specific optimization</span>
                    </div>
                  </div>
                </div>

                {/* Input Method Tabs */}
                <Suspense fallback={<LoadingFallback />}>
                  <InputMethodTabs
                    userId={mockUser.id}
                    userPlan={mockUser.plan}
                    currentUsage={mockUser.currentUsage}
                    onGenerationComplete={handleGenerationComplete}
                    onUsageUpdate={handleUsageUpdate}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Generation History</h2>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>History feature coming soon in Phase 1B</p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics</h2>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics dashboard coming soon in Phase 1B</p>
                </div>
              </div>
            )}

            {/* Other tabs similar structure */}
          </div>

          {/* Right Panel */}
          {rightPanelOpen && (
            <div className="w-80 bg-card border-l p-6 space-y-6 overflow-y-auto">
              {/* Panel Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Workspace</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Recent Generations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Generations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockUser.recentGenerations.map((generation) => (
                    <div key={generation.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{generation.productName}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{generation.platform}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(generation.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    View All History
                  </Button>
                </CardContent>
              </Card>

              {/* Platform Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Platform Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {platformStatus.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          platform.status === 'operational' ? 'bg-green-500' :
                          platform.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                        <span className="text-sm">{platform.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{platform.uptime}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Quick Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      💡 {tip}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upgrade Prompt */}
              {mockUser.plan === 'free' && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Upgrade to Pro</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get 100x more generations, all platforms, and CSV bulk processing.
                      </p>
                      <Button size="sm" className="w-full">
                        Upgrade Now
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Right Panel Toggle (when closed) */}
          {!rightPanelOpen && (
            <div className="w-12 bg-card border-l flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelOpen(true)}
                className="rotate-180"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Support Chat */}
      <Suspense fallback={null}>
        <SupportChat
          userId={mockUser.id}
          userPlan={mockUser.plan}
          currentPage="/dashboard"
        />
      </Suspense>
    </div>
  )
}