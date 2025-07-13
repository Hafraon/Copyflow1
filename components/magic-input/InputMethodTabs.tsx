import React, { useState, useCallback, useMemo, memo } from 'react'
import { FileText, Upload, Link, Zap, TrendingUp, Target, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserPlanType, GenerationResponse, EmojiSettings } from '@/lib/types'
import { TextInputFormData, CSVUploadFormData, URLInputFormData } from '@/lib/form-schemas'
import { URLParseResult } from '@/lib/url-parser'
import { CSVParseResult } from '@/lib/csv-parser'
import { 
  calculateUsage, 
  getPlanLimit, 
  getUsageStatus,
  formatUsageDisplay 
} from '@/lib/usage-tracker'
import { TextInputContainer } from './TextInputContainer'
import { CSVUploader } from './CSVUploader'
import { URLInput } from './URLInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorMessage } from '@/components/ui/error-message'

type InputMethod = 'text' | 'csv' | 'url'

interface InputMethodState {
  text: {
    formData: TextInputFormData | null
    platforms: string[]
    emojiSettings: EmojiSettings
    isComplete: boolean
  }
  csv: {
    parseResult: CSVParseResult | null
    selectedRows: number[]
    globalSettings: Partial<CSVUploadFormData>
    isComplete: boolean
  }
  url: {
    formData: URLInputFormData | null
    extractedData: URLParseResult | null
    isComplete: boolean
  }
}

interface InputMethodTabsProps {
  userId: string
  userPlan: UserPlanType
  currentUsage: number
  onGenerationComplete: (response: GenerationResponse, method: InputMethod) => void
  onUsageUpdate: (newUsage: number) => void
  className?: string
}

// Memoized sub-components for performance
const MemoizedTextInputContainer = memo(TextInputContainer)
const MemoizedCSVUploader = memo(CSVUploader)
const MemoizedURLInput = memo(URLInput)

export const InputMethodTabs: React.FC<InputMethodTabsProps> = ({
  userId,
  userPlan,
  currentUsage,
  onGenerationComplete,
  onUsageUpdate,
  className
}) => {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('text')
  const [methodStates, setMethodStates] = useState<InputMethodState>({
    text: {
      formData: null,
      platforms: ['universal'],
      emojiSettings: {
        enabled: true,
        intensity: 'medium',
        categorySpecific: true,
        intensityConfig: {
          low: { count: '3-5', example: '✅ Quality 🚚 Fast' },
          medium: { count: '8-12', example: '✅ Quality 🔥 Price 🚚 Delivery ⚡ Fast 💯 Guaranteed' },
          high: { count: '15-20', example: '✅🔥⚡💯🎯🚀💎✨🌟⭐🏆🎁🔋📱💝' }
        }
      },
      isComplete: false
    },
    csv: {
      parseResult: null,
      selectedRows: [],
      globalSettings: {},
      isComplete: false
    },
    url: {
      formData: null,
      extractedData: null,
      isComplete: false
    }
  })

  // Calculate usage and limits
  const planLimit = getPlanLimit(userPlan)
  const usageStatus = getUsageStatus(currentUsage, planLimit)
  
  // Memoize tab configuration to prevent unnecessary re-renders
  const tabConfig = useMemo(() => ({
    text: {
      id: 'text',
      label: 'Text Input',
      icon: FileText,
      title: 'Single Product Enhancement',
      description: 'Generate optimized content for one product',
      helpText: 'Perfect for testing and single product optimization',
      estimatedUsage: calculateUsage(methodStates.text.platforms),
      color: 'blue'
    },
    csv: {
      id: 'csv',
      label: 'CSV Bulk',
      icon: Upload,
      title: 'Export → Super-Export Workflow',
      description: 'Transform your product catalog with AI enhancement',
      helpText: 'Upload CSV, get enhanced CSV with CopyFlow_ columns',
      estimatedUsage: methodStates.csv.selectedRows.length * calculateUsage(['universal']),
      color: 'green'
    },
    url: {
      id: 'url',
      label: 'URL Intelligence',
      icon: Link,
      title: 'Competitor Spy & Enhancement',
      description: 'Analyze competitors and create superior content',
      helpText: 'Extract competitor data and generate better content',
      estimatedUsage: calculateUsage(['universal']),
      color: 'purple'
    }
  }), [methodStates.text.platforms, methodStates.csv.selectedRows.length])

  // Get tab status
  const getTabStatus = useCallback((method: InputMethod) => {
    const state = methodStates[method]
    if (state.isComplete) return 'complete'
    
    switch (method) {
      case 'text':
        return state.formData ? 'in-progress' : 'empty'
      case 'csv':
        return state.parseResult ? 'in-progress' : 'empty'
      case 'url':
        return state.extractedData ? 'in-progress' : 'empty'
      default:
        return 'empty'
    }
  }, [methodStates])

  // Handle text input completion
  const handleTextInputComplete = useCallback((response: GenerationResponse) => {
    setMethodStates(prev => ({
      ...prev,
      text: { ...prev.text, isComplete: true }
    }))
    onGenerationComplete(response, 'text')
  }, [onGenerationComplete])

  // Handle CSV processing
  const handleCSVProcessed = useCallback((result: CSVParseResult, selectedRows: number[]) => {
    setMethodStates(prev => ({
      ...prev,
      csv: {
        ...prev.csv,
        parseResult: result,
        selectedRows,
        isComplete: false
      }
    }))
  }, [])

  // Handle URL extraction
  const handleURLSubmit = useCallback(async (data: URLInputFormData, extractedData: URLParseResult) => {
    setMethodStates(prev => ({
      ...prev,
      url: {
        formData: data,
        extractedData,
        isComplete: false
      }
    }))
    
    // TODO: Trigger URL-based generation
    console.log('URL generation:', { data, extractedData })
  }, [])

  // Handle CSV error
  const handleCSVError = useCallback((error: string) => {
    console.error('CSV error:', error)
  }, [])

  // Reset method state
  const resetMethodState = (method: InputMethod) => {
    setMethodStates(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        isComplete: false,
        ...(method === 'text' && { formData: null }),
        ...(method === 'csv' && { parseResult: null, selectedRows: [] }),
        ...(method === 'url' && { formData: null, extractedData: null })
      }
    }))
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Usage Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Magic Input System</span>
            <div className="flex items-center space-x-2">
              <Badge variant={usageStatus.status === 'safe' ? 'success' : 'warning'}>
                {formatUsageDisplay(currentUsage, planLimit)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {userPlan} Plan
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress 
              value={(currentUsage / planLimit) * 100} 
              className="h-2"
              variant={usageStatus.status === 'safe' ? 'default' : 'warning'}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Choose your preferred input method below</span>
              <span className={cn(
                'font-medium',
                usageStatus.color === 'green' && 'text-green-600',
                usageStatus.color === 'yellow' && 'text-yellow-600',
                usageStatus.color === 'red' && 'text-red-600'
              )}>
                {usageStatus.message}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method Selection Tabs */}
      <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as InputMethod)}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          {Object.entries(tabConfig).map(([key, config]) => {
            const method = key as InputMethod
            const status = getTabStatus(method)
            const Icon = config.icon
            
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center space-y-2 p-4 h-auto data-[state=active]:bg-background"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{config.label}</span>
                  {status === 'complete' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {status === 'in-progress' && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{config.title}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
                {config.estimatedUsage > 0 && (
                  <Badge variant="outline" size="sm">
                    {config.estimatedUsage} generations
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Text Input Tab */}
          <TabsContent value="text" className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {tabConfig.text.title}
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      {tabConfig.text.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <Info className="h-3 w-3" />
                      <span>{tabConfig.text.helpText}</span>
                    </div>
                  </div>
                  {methodStates.text.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetMethodState('text')}
                      className="ml-auto"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <MemoizedTextInputContainer
              userId={userId}
              userPlan={userPlan}
              currentUsage={currentUsage}
              onGenerationComplete={handleTextInputComplete}
              onUsageUpdate={onUsageUpdate}
            />
          </TabsContent>

          {/* CSV Bulk Tab */}
          <TabsContent value="csv" className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Upload className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">
                      {tabConfig.csv.title}
                    </h4>
                    <p className="text-sm text-green-700 mb-2">
                      {tabConfig.csv.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>{tabConfig.csv.helpText}</span>
                    </div>
                  </div>
                  {methodStates.csv.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetMethodState('csv')}
                      className="ml-auto"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <MemoizedCSVUploader
              userPlan={userPlan}
              onFileProcessed={handleCSVProcessed}
              onError={handleCSVError}
            />

            {/* CSV Processing Status */}
            {methodStates.csv.parseResult && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Ready for Bulk Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        {methodStates.csv.selectedRows.length} products selected from {methodStates.csv.parseResult.totalRows} total
                      </p>
                    </div>
                    <Badge variant="success">
                      {methodStates.csv.selectedRows.length * calculateUsage(['universal'])} generations needed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* URL Intelligence Tab */}
          <TabsContent value="url" className="space-y-4">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 mb-1">
                      {tabConfig.url.title}
                    </h4>
                    <p className="text-sm text-purple-700 mb-2">
                      {tabConfig.url.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-purple-600">
                      <Zap className="h-3 w-3" />
                      <span>{tabConfig.url.helpText}</span>
                    </div>
                  </div>
                  {methodStates.url.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetMethodState('url')}
                      className="ml-auto"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <MemoizedURLInput
              onSubmit={handleURLSubmit}
              defaultValues={methodStates.url.formData || undefined}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Cross-Method Features Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              All methods share platform selection, emoji settings, and language preferences. 
              Your usage is tracked across all generation methods.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}