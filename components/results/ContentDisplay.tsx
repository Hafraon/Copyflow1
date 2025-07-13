import React from 'react'
import { useState, useRef } from 'react'
import { 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileText, 
  Target, 
  Smartphone, 
  Users, 
  Brain, 
  Trophy,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Table,
  X,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyFlowOutput } from '@/lib/types'
import { 
  exportToTXT, 
  exportToCSV, 
  exportToXLSX, 
  exportToJSON, 
  downloadFile, 
  generateFileName,
  getExportSizeEstimate,
  validateContentForExport,
  ExportFormat,
  EXPORT_FORMATS
} from '@/lib/export-manager'
import { handleExportError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ContentDisplayProps {
  content: CopyFlowOutput
  onRegenerate?: () => void
  onExport?: (format: 'txt' | 'csv' | 'json') => void
  isRegenerating?: boolean
  className?: string
}

interface CopyState {
  [key: string]: boolean
}

interface ExportHistoryItem {
  id: string
  format: ExportFormat
  timestamp: Date
  fileName: string
  fileSize: string
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  onRegenerate,
  onExport,
  isRegenerating = false,
  className
}) => {
  const [activeTab, setActiveTab] = useState('main')
  const [copyStates, setCopyStates] = useState<CopyState>({})
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])
  const [showExportPreview, setShowExportPreview] = useState(false)
  const [exportPreviewContent, setExportPreviewContent] = useState('')
  
  const exportTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Export format information
  const formatInfo = {
    txt: {
      name: 'Text File',
      icon: FileTextIcon,
      description: 'Simple text format with all content sections',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      estimatedSize: getExportSizeEstimate(content, 'txt'),
      importCompatibility: 'Manual copy-paste only'
    },
    csv: {
      name: 'CSV Spreadsheet',
      icon: Table,
      description: 'Tabular format with CopyFlow_ columns',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      estimatedSize: getExportSizeEstimate(content, 'csv'),
      importCompatibility: 'High (98% success rate)'
    },
    xlsx: {
      name: 'Excel Workbook',
      icon: FileSpreadsheet,
      description: 'Multi-sheet Excel file with formatting',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      estimatedSize: getExportSizeEstimate(content, 'xlsx'),
      importCompatibility: 'Medium-High (90% success rate)'
    },
    json: {
      name: 'JSON Data',
      icon: FileJson,
      description: 'Structured data format for developers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      estimatedSize: getExportSizeEstimate(content, 'json'),
      importCompatibility: 'API/Developer use only'
    }
  }

  // Generate export preview
  const generateExportPreview = () => {
    try {
      let preview = ''
      
      switch (selectedFormat) {
        case 'txt':
          preview = exportToTXT(content).substring(0, 500) + '...'
          break
        case 'csv':
          preview = exportToCSV([content]).substring(0, 500) + '...'
          break
        case 'json':
          const jsonData = exportToJSON([content], {
            generatedAt: new Date().toISOString(),
            totalItems: 1,
            inputMethod: 'text',
            platformsGenerated: ['universal'],
            generationsUsed: 1,
            language: 'en',
            writingStyle: 'professional'
          })
          preview = jsonData.substring(0, 500) + '...'
          break
        case 'xlsx':
          preview = 'XLSX preview not available (binary format)'
          break
      }
      
      setExportPreviewContent(preview)
      setShowExportPreview(true)
    } catch (error) {
      console.error('Failed to generate preview:', error)
      toast.error('Failed to generate preview')
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)
      
      // Validate content
      const validation = validateContentForExport(content)
      if (!validation.valid) {
        throw new Error(`Export validation failed: ${validation.errors[0]}`)
        setIsExporting(false)
        return
      }
      
      // Simulate progress
      exportTimeoutRef.current = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      // Generate filename
      const fileName = generateFileName(content.productTitle, selectedFormat)
      
      // Export based on format
      switch (selectedFormat) {
        case 'txt':
          const txtContent = exportToTXT(content)
          downloadFile(txtContent, fileName, 'txt')
          break
          
        case 'csv':
          const csvContent = exportToCSV([content])
          downloadFile(csvContent, fileName, 'csv')
          break
          
        case 'xlsx':
          const xlsxContent = exportToXLSX([content])
          const xlsxBlob = new Blob([xlsxContent], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          const xlsxUrl = URL.createObjectURL(xlsxBlob)
          const link = document.createElement('a')
          link.href = xlsxUrl
          link.download = fileName
          link.click()
          URL.revokeObjectURL(xlsxUrl)
          break
          
        case 'json':
          const jsonContent = exportToJSON([content], {
            generatedAt: new Date().toISOString(),
            totalItems: 1,
            inputMethod: 'text',
            platformsGenerated: ['universal'],
            generationsUsed: 1,
            language: 'en',
            writingStyle: 'professional'
          })
          downloadFile(jsonContent, fileName, 'json')
          break
      }
      
      // Add to export history
      const historyItem: ExportHistoryItem = {
        id: Date.now().toString(),
        format: selectedFormat,
        timestamp: new Date(),
        fileName,
        fileSize: formatInfo[selectedFormat].estimatedSize
      }
      
      setExportHistory(prev => [historyItem, ...prev].slice(0, 10))
      
      // Complete progress
      setExportProgress(100)
      
      // Success notification
      toast.success(`${selectedFormat.toUpperCase()} export successful!`)
      
      // Call onExport callback if provided
      if (onExport) {
        onExport(selectedFormat)
      }
      
      // Close dialog after a delay
      setTimeout(() => {
        setIsExportDialogOpen(false)
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
      
    } catch (error) {
      // Enhanced error handling
      await handleExportError(error, {
        onTryAnotherFormat: () => {
          // Suggest a different format based on current selection
          const alternateFormat = selectedFormat === 'txt' ? 'csv' : 
                                 selectedFormat === 'csv' ? 'txt' : 
                                 selectedFormat === 'xlsx' ? 'json' : 'txt'
          setSelectedFormat(alternateFormat as ExportFormat)
          toast.info(`Try exporting as ${alternateFormat.toUpperCase()} instead`)
        },
        context: {
          format: selectedFormat,
          contentTitle: content.productTitle,
          contentSize: JSON.stringify(content).length
        }
      })
      
      setIsExporting(false)
      setExportProgress(0)
    } finally {
      if (exportTimeoutRef.current) {
        clearInterval(exportTimeoutRef.current)
        exportTimeoutRef.current = null
      }
    }
  }

  // Character count with optimization tips
  const getCharacterInfo = (text: string, optimal: { min: number; max: number }) => {
    const length = text.length
    const isOptimal = length >= optimal.min && length <= optimal.max
    const status = length < optimal.min ? 'short' : length > optimal.max ? 'long' : 'optimal'
    
    return {
      length,
      isOptimal,
      status,
      message: status === 'short' 
        ? `Too short (${optimal.min}-${optimal.max} recommended)`
        : status === 'long'
          ? `Too long (${optimal.min}-${optimal.max} recommended)`
          : `Perfect length (${optimal.min}-${optimal.max})`
    }
  }

  // Content quality indicator
  const getQualityScore = (text: string): number => {
    let score = 0
    if (text.length > 50) score += 25
    if (text.includes('✅') || text.includes('🔥')) score += 15
    if (text.split(' ').length > 10) score += 25
    if (/[A-Z]/.test(text)) score += 15
    if (text.includes('!') || text.includes('?')) score += 20
    return Math.min(score, 100)
  }

  // Content item component
  const ContentItem: React.FC<{
    label: string
    content: string
    copyKey: string
    optimal?: { min: number; max: number }
    helpText?: string
    multiline?: boolean
  }> = ({ label, content, copyKey, optimal, helpText, multiline = false }) => {
    const charInfo = optimal ? getCharacterInfo(content, optimal) : null
    const qualityScore = getQualityScore(content)
    const isCopied = copyStates[copyKey]

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center space-x-2">
            <span>{label}</span>
            {helpText && (
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border shadow-md z-10">
                  {helpText}
                </div>
              </div>
            )}
          </label>
          <div className="flex items-center space-x-2">
            {charInfo && (
              <Badge 
                variant={charInfo.isOptimal ? "success" : "warning"}
                size="sm"
              >
                {charInfo.length} chars
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content, copyKey)}
              className="h-6 px-2"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {multiline ? (
          <Textarea
            value={content}
            readOnly
            className="min-h-[100px] resize-none"
          />
        ) : (
          <div className="p-3 bg-muted/50 rounded-md text-sm border">
            {content}
          </div>
        )}

        {/* Character info and quality */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {charInfo && (
              <span className={cn(
                charInfo.isOptimal ? 'text-green-600' : 'text-yellow-600'
              )}>
                {charInfo.message}
              </span>
            )}
            <div className="flex items-center space-x-1">
              <span>Quality:</span>
              <Progress value={qualityScore} className="w-12 h-1" />
              <span>{qualityScore}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List content component
  const ListContent: React.FC<{
    label: string
    items: string[]
    copyKey: string
    helpText?: string
  }> = ({ label, items, copyKey, helpText }) => {
    const content = items.join('\n')
    const isCopied = copyStates[copyKey]

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center space-x-2">
            <span>{label}</span>
            {helpText && (
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border shadow-md z-10">
                  {helpText}
                </div>
              </div>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" size="sm">
              {items.length} items
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content, copyKey)}
              className="h-6 px-2"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-muted/50 rounded text-sm">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Tab configuration
  const tabs = [
    {
      id: 'main',
      label: 'Main Content',
      icon: FileText,
      badge: '5 items'
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: Target,
      badge: '4 items'
    },
    {
      id: 'viral',
      label: 'Viral Content',
      icon: Smartphone,
      badge: '2 items'
    },
    {
      id: 'audience',
      label: 'Audience',
      icon: Users,
      badge: '3 items'
    },
    {
      id: 'psychology',
      label: 'Psychology',
      icon: Brain,
      badge: '4 items'
    },
    {
      id: 'competitive',
      label: 'Competitive',
      icon: Trophy,
      badge: '3 items'
    }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Generated Content</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm" 
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
                loading={isRegenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>6 content sections generated</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>SEO optimized</span>
            </div>
            <div className="flex items-center space-x-1">
              <Smartphone className="h-4 w-4" />
              <span>Social media ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Content</span>
            </DialogTitle>
            <DialogDescription>
              Choose your preferred export format for "{content.productTitle}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formatInfo).map(([format, info]) => {
                const Icon = info.icon
                const isSelected = selectedFormat === format
                
                return (
                  <Card 
                    key={format}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedFormat(format as ExportFormat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          info.bgColor
                        )}>
                          <Icon className={cn("h-5 w-5", info.color)} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{info.name}</h3>
                            <Badge variant={isSelected ? "default" : "outline"} size="sm">
                              .{format}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {info.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              ~{info.estimatedSize}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFormat(format as ExportFormat)
                                generateExportPreview()
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Export Preview */}
            {showExportPreview && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Export Preview ({selectedFormat.toUpperCase()})</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => setShowExportPreview(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-background border rounded-md p-3 text-xs font-mono overflow-auto max-h-40">
                    <pre className="whitespace-pre-wrap">{exportPreviewContent}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Import Compatibility */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Import Compatibility</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatInfo[selectedFormat].importCompatibility}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <HelpCircle className="h-3 w-3" />
                      <span>
                        {selectedFormat === 'csv' || selectedFormat === 'xlsx' 
                          ? 'Original columns preserved for seamless import back to your platform'
                          : 'This format is for reference and manual use'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Export History */}
            {exportHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Exports</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {exportHistory.map(item => {
                    const ItemIcon = formatInfo[item.format].icon
                    
                    return (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-2 text-xs bg-muted/50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <ItemIcon className={cn("h-3 w-3", formatInfo[item.format].color)} />
                          <span className="font-medium truncate max-w-[150px]">{item.fileName}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-muted-foreground">{item.fileSize}</span>
                          <span className="text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Export Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting {selectedFormat.toUpperCase()}</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {exportProgress < 100 
                    ? 'Preparing your export...' 
                    : 'Export complete! Downloading file...'}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              loading={isExporting}
            >
              {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center space-y-1 p-3 h-auto data-[state=active]:bg-background"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{tab.label}</span>
                <Badge variant="outline" size="sm" className="text-xs">
                  {tab.badge}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Main Content Tab */}
        <TabsContent value="main" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Main Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ContentItem
                label="Product Title"
                content={content.productTitle}
                copyKey="productTitle"
                optimal={{ min: 40, max: 60 }}
                helpText="Main product title for listings and search results"
              />
              
              <ContentItem
                label="Product Description"
                content={content.productDescription}
                copyKey="productDescription"
                optimal={{ min: 500, max: 1800 }}
                helpText="Detailed product description for listings"
                multiline
              />
              
              <ContentItem
                label="SEO Title"
                content={content.seoTitle}
                copyKey="seoTitle"
                optimal={{ min: 40, max: 60 }}
                helpText="Optimized title for search engines"
              />
              
              <ContentItem
                label="Meta Description"
                content={content.metaDescription}
                copyKey="metaDescription"
                optimal={{ min: 80, max: 160 }}
                helpText="Search engine snippet description"
              />
              
              <ContentItem
                label="Call to Action"
                content={content.callToAction}
                copyKey="callToAction"
                optimal={{ min: 15, max: 50 }}
                helpText="Compelling action phrase for buttons"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Marketing Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ListContent
                label="Bullet Points"
                items={content.bulletPoints}
                copyKey="bulletPoints"
                helpText="Key selling points for product listings"
              />
              
              <ListContent
                label="Key Features"
                items={content.keyFeatures}
                copyKey="keyFeatures"
                helpText="Technical specifications and features"
              />
              
              <ListContent
                label="Tags"
                items={content.tags}
                copyKey="tags"
                helpText="SEO keywords and search tags"
              />
              
              <ContentItem
                label="Amazon Backend Keywords"
                content={content.amazonBackendKeywords}
                copyKey="amazonBackendKeywords"
                optimal={{ min: 240, max: 249 }}
                helpText="Hidden keywords for Amazon search (max 249 chars)"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Viral Content Tab */}
        <TabsContent value="viral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Viral Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ListContent
                label="TikTok Hooks"
                items={content.viralContent.tiktokHooks}
                copyKey="tiktokHooks"
                helpText="Attention-grabbing hooks for TikTok videos"
              />
              
              <ListContent
                label="Instagram Captions"
                items={content.viralContent.instagramCaptions}
                copyKey="instagramCaptions"
                helpText="Engaging captions for Instagram posts"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Target Audience</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ContentItem
                label="Primary Audience"
                content={content.targetAudience.primary}
                copyKey="primaryAudience"
                optimal={{ min: 30, max: 150 }}
                helpText="Main target customer description"
              />
              
              <ListContent
                label="Pain Points"
                items={content.targetAudience.painPoints}
                copyKey="painPoints"
                helpText="Customer problems this product solves"
              />
              
              <ListContent
                label="Desires"
                items={content.targetAudience.desires}
                copyKey="desires"
                helpText="Customer wants and aspirations"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Psychology & Triggers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ListContent
                label="Emotional Hooks"
                items={content.emotionalHooks}
                copyKey="emotionalHooks"
                helpText="Emotional triggers to connect with customers"
              />
              
              <ListContent
                label="Conversion Triggers"
                items={content.conversionTriggers}
                copyKey="conversionTriggers"
                helpText="Psychological triggers to drive purchases"
              />
              
              <ListContent
                label="Trust Signals"
                items={content.trustSignals}
                copyKey="trustSignals"
                helpText="Elements that build customer confidence"
              />
              
              <ListContent
                label="Urgency Elements"
                items={content.urgencyElements}
                copyKey="urgencyElements"
                helpText="Scarcity and urgency tactics"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Tab */}
        <TabsContent value="competitive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Competitive Advantage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ListContent
                label="Competitor Advantages"
                items={content.competitorAdvantages}
                copyKey="competitorAdvantages"
                helpText="Unique selling points vs competition"
              />
              
              <ContentItem
                label="Price Anchor"
                content={content.priceAnchor}
                copyKey="priceAnchor"
                optimal={{ min: 50, max: 200 }}
                helpText="Value justification and price positioning"
              />
              
              <ListContent
                label="Keyword Gaps"
                items={content.keywordGaps}
                copyKey="keywordGaps"
                helpText="Keywords competitors are missing"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile accordion for smaller screens */}
      <div className="lg:hidden">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Use tabs above to navigate between content sections. 
                Each section is optimized for different use cases.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}