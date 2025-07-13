import React from 'react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Link, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Target, 
  Zap,
  ShoppingCart,
  Package,
  Instagram,
  Video,
  Facebook,
  Palette,
  Globe,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { URLInputSchema, type URLInputFormData } from '@/lib/form-schemas'
import { 
  detectPlatform, 
  extractDataFromURL, 
  getSupportedPlatforms,
  type PlatformType,
  type URLParseResult 
} from '@/lib/url-parser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorMessage } from '@/components/ui/error-message'
import { Progress } from '@/components/ui/progress'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'

// Platform icons mapping
const PLATFORM_ICONS = {
  amazon: ShoppingCart,
  shopify: Package,
  aliexpress: Globe,
  khoroshop: Package,
  etsy: Palette,
  ebay: Package,
  instagram: Instagram,
  facebook: Facebook,
  unknown: Globe
} as const

// Example URLs for testing
const EXAMPLE_URLS = {
  amazon: 'https://www.amazon.com/dp/B08N5WRWNW',
  shopify: 'https://example.myshopify.com/products/sample-product',
  aliexpress: 'https://www.aliexpress.com/item/1005001234567890.html',
  khoroshop: 'https://khoroshop.ua/product/sample-product',
  etsy: 'https://www.etsy.com/listing/123456789/handmade-item',
  ebay: 'https://www.ebay.com/itm/123456789012',
  instagram: 'https://www.instagram.com/p/ABC123DEF456/',
  facebook: 'https://www.facebook.com/marketplace/item/123456789012345'
}

interface URLInputProps {
  onSubmit: (data: URLInputFormData, extractedData: URLParseResult) => Promise<void>
  defaultValues?: Partial<URLInputFormData>
  isLoading?: boolean
  className?: string
}

export const URLInput: React.FC<URLInputProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false,
  className
}) => {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>('unknown')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<URLParseResult | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  const form = useForm<URLInputFormData>({
    resolver: zodResolver(URLInputSchema),
    defaultValues: {
      url: '',
      analysisDepth: 'detailed',
      targetPlatforms: ['universal'],
      enhancementFocus: 'content',
      writingStyle: 'professional',
      language: 'en',
      emojiIntensity: 'medium',
      includeEmojis: true,
      ...defaultValues
    }
  })

  const { handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form
  const watchedURL = watch('url')

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (watchedURL) {
      try {
        const platform = detectPlatform(watchedURL)
        setDetectedPlatform(platform)
        setExtractionError(null)
      } catch {
        setDetectedPlatform('unknown')
      }
    } else {
      setDetectedPlatform('unknown')
    }
  }, [watchedURL])

  // Extract data from URL
  const handleExtractData = async () => {
    if (!watchedURL) return

    setIsExtracting(true)
    setExtractionProgress(0)
    setExtractionError(null)
    setExtractedData(null)

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 500)

      const result = await extractDataFromURL(watchedURL)
      
      clearInterval(progressInterval)
      setExtractionProgress(100)

      if (result.success) {
        setExtractedData(result)
      } else {
        setExtractionError(result.error || 'Failed to extract data from URL')
      }
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle form submission
  const onFormSubmit = async (data: URLInputFormData) => {
    if (!extractedData) {
      setExtractionError('Please extract data from URL first')
      return
    }

    try {
      await onSubmit(data, extractedData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Set example URL
  const setExampleURL = (platform: keyof typeof EXAMPLE_URLS) => {
    setValue('url', EXAMPLE_URLS[platform])
  }

  // Get platform display info
  const getPlatformInfo = (platform: PlatformType) => {
    const Icon = PLATFORM_ICONS[platform] || Globe
    const names = {
      amazon: 'Amazon',
      shopify: 'Shopify',
      aliexpress: 'AliExpress',
      khoroshop: 'Хорошоп',
      etsy: 'Etsy',
      ebay: 'eBay',
      instagram: 'Instagram',
      facebook: 'Facebook',
      unknown: 'Unknown Platform'
    }
    
    return {
      name: names[platform],
      icon: Icon,
      supported: platform !== 'unknown'
    }
  }

  const platformInfo = getPlatformInfo(detectedPlatform)
  const supportedPlatforms = getSupportedPlatforms()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Competitor Analysis & Content Enhancement
              </h3>
              <p className="text-blue-700 mb-3">
                We'll analyze this competitor and generate <strong>BETTER</strong> content for your product
              </p>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Eye className="h-4 w-4" />
                <span>Extract competitor data → Analyze strengths → Create superior content</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>URL Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* URL Input */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>
                      Competitor Product URL
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="https://example.com/product/..."
                            leftIcon={<Link className="h-4 w-4" />}
                            error={errors.url?.message}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleExtractData}
                            disabled={!watchedURL || isExtracting || !platformInfo.supported}
                            loading={isExtracting}
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Extract Data
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Platform Detection */}
                        {watchedURL && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <platformInfo.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Detected Platform: {platformInfo.name}
                              </span>
                              <Badge 
                                variant={platformInfo.supported ? "success" : "warning"}
                                size="sm"
                              >
                                {platformInfo.supported ? "Supported" : "Not Supported"}
                              </Badge>
                            </div>
                            {watchedURL && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(watchedURL, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter a product URL from a supported e-commerce platform
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Extraction Progress */}
              {isExtracting && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Extracting competitor data...
                        </span>
                        <span className="text-sm text-blue-700">
                          {extractionProgress}%
                        </span>
                      </div>
                      <Progress value={extractionProgress} className="h-2" />
                      <p className="text-xs text-blue-600">
                        Analyzing product information, pricing, and content structure
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extraction Results */}
              {extractedData && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 mb-2">
                          Data Extracted Successfully
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700 font-medium">Title:</span>
                            <p className="text-green-800 truncate">{extractedData.data?.title}</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Platform:</span>
                            <p className="text-green-800 capitalize">{extractedData.platform}</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Images:</span>
                            <p className="text-green-800">{extractedData.data?.images.length || 0} found</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Processing Time:</span>
                            <p className="text-green-800">{extractedData.extractionTime}ms</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extraction Error */}
              {extractionError && (
                <ErrorMessage
                  type="error"
                  title="Extraction Failed"
                  message={extractionError}
                  actions={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExtractData}
                      disabled={!watchedURL || isExtracting}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  }
                />
              )}

              {/* Analysis Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Analysis Depth */}
                <FormField
                  control={form.control}
                  name="analysisDepth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Analysis Depth</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select analysis depth" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">
                            <div className="flex flex-col">
                              <span className="font-medium">Basic</span>
                              <span className="text-xs text-muted-foreground">
                                Title, description, price
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="detailed">
                            <div className="flex flex-col">
                              <span className="font-medium">Detailed</span>
                              <span className="text-xs text-muted-foreground">
                                + Features, specs, SEO elements
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="competitive">
                            <div className="flex flex-col">
                              <span className="font-medium">Competitive</span>
                              <span className="text-xs text-muted-foreground">
                                + Market analysis, positioning
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enhancement Focus */}
                <FormField
                  control={form.control}
                  name="enhancementFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enhancement Focus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select focus area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="content">
                            <div className="flex flex-col">
                              <span className="font-medium">Content Quality</span>
                              <span className="text-xs text-muted-foreground">
                                Better descriptions, features
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="competitive">
                            <div className="flex flex-col">
                              <span className="font-medium">Competitive Edge</span>
                              <span className="text-xs text-muted-foreground">
                                Unique selling points
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="viral">
                            <div className="flex flex-col">
                              <span className="font-medium">Viral Potential</span>
                              <span className="text-xs text-muted-foreground">
                                Social media optimization
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {extractedData ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ready to generate enhanced content
                    </span>
                  ) : (
                    <span>Extract competitor data to continue</span>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={!extractedData || isLoading || isSubmitting}
                  loading={isLoading || isSubmitting}
                  size="lg"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Enhanced Content
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Supported Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {supportedPlatforms.map((platform) => {
              const info = getPlatformInfo(platform)
              const Icon = info.icon
              
              return (
                <div
                  key={platform}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setExampleURL(platform as keyof typeof EXAMPLE_URLS)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{info.name}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click on a platform to use an example URL
          </p>
        </CardContent>
      </Card>
    </div>
  )
}