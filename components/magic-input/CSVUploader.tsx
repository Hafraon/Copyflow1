import React from 'react'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { parseCSV, formatFileSize, getFileSizeLimit, type CSVParseResult } from '@/lib/csv-parser'
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { UserPlanType } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/ui/error-message'
import { ApiErrorMessage } from '@/components/ui/api-error-message'
import { Checkbox } from '@/components/ui/checkbox'

interface CSVUploaderProps {
  userPlan: UserPlanType
  onFileProcessed: (result: CSVParseResult, selectedRows: number[]) => void
  onError: (error: string) => void
  className?: string
  disabled?: boolean
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  userPlan,
  onFileProcessed,
  onError,
  className,
  disabled = false
}) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Web Worker reference
  const workerRef = useRef<Worker | null>(null)

  // File size limit for current plan
  const fileSizeLimit = getFileSizeLimit(userPlan)
  const fileSizeLimitMB = Math.round(fileSizeLimit / (1024 * 1024))

  // Initialize Web Worker for CSV parsing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      // Create worker for CSV parsing
      const workerCode = `
        self.onmessage = function(e) {
          const { file, userPlan } = e.data;
          
          // Mock CSV parsing (in real implementation, this would parse the CSV)
          self.postMessage({ type: 'progress', progress: 50 });
          
          // Simulate processing
          setTimeout(() => {
            self.postMessage({ 
              type: 'result', 
              result: {
                success: true,
                headers: ['Product Name', 'Description', 'Price'],
                sampleData: [
                  ['Product 1', 'Description 1', '$10.99'],
                  ['Product 2', 'Description 2', '$20.99']
                ],
                totalRows: 2,
                detectedEncoding: 'utf-8',
                columnTypes: [],
                fileSize: file.size,
                processingTime: 100,
                warnings: []
              }
            });
          }, 500);
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerRef.current = new Worker(URL.createObjectURL(blob));
      
      // Set up message handler
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setUploadProgress(e.data.progress);
        } else if (e.data.type === 'result') {
          setParseResult(e.data.result);
          setUploadProgress(100);
          setIsProcessing(false);
          
          // Auto-select all rows
          const allRows = Array.from({ length: e.data.result.totalRows }, (_, i) => i);
          setSelectedRows(allRows);
        }
      };
    }
    
    // Cleanup worker
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setError(null)
    setParseResult(null)
    setSelectedRows([])
    setIsProcessing(true)
    setUploadProgress(0)

    // Use Web Worker for large files
    if (workerRef.current && file.size > 5 * 1024 * 1024) { // 5MB
      try {
        // Send file to worker
        workerRef.current.postMessage({ file, userPlan });
        return;
      } catch (error) {
        console.warn('Worker processing failed, falling back to main thread', error);
        // Continue with main thread processing
      }
    }

    // Main thread processing for smaller files or if worker fails
    try {
      // Parse CSV with progress tracking
      const result = await parseCSV(file, userPlan, {}, (progress) => {
        setUploadProgress(progress)
      })

      if (result.success) {
        setParseResult(result)
        // Auto-select all rows initially
        const allRows = Array.from({ length: result.totalRows }, (_, i) => i)
        setSelectedRows(allRows)
        setUploadProgress(100)
      } else {
        const errorMessage = result.error || 'Failed to parse CSV file'
        
        // Enhanced error handling
        await handleError(new Error(errorMessage), {
          type: ErrorType.IMPORT,
          message: errorMessage,
          severity: ErrorSeverity.ERROR,
          context: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userPlan
          },
          showToast: true
        })
        
        setError(errorMessage)
        onError(errorMessage)
      }
    } catch (err) {
      // Enhanced error handling for unexpected errors
      const error = err instanceof Error ? err : new Error('Unknown CSV parsing error')
      
      await handleError(error, {
        type: ErrorType.IMPORT,
        message: 'CSV parsing failed',
        severity: ErrorSeverity.ERROR,
        context: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          userPlan
        },
        showToast: true
      })
      
      setError(error.message)
      onError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }, [userPlan, disabled, onError, onFileProcessed])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: fileSizeLimit,
    disabled: disabled || isProcessing
  })

  // Handle row selection
  const handleRowToggle = (rowIndex: number) => {
    setSelectedRows(prev => 
      prev.includes(rowIndex)
        ? prev.filter(i => i !== rowIndex)
        : [...prev, rowIndex]
    )
  }

  // Select/deselect all rows
  const handleSelectAll = (checked: boolean) => {
    if (checked && parseResult) {
      const allRows = Array.from({ length: parseResult.totalRows }, (_, i) => i)
      setSelectedRows(allRows)
    } else {
      setSelectedRows([])
    }
  }

  // Process selected data
  const handleProcessData = () => {
    if (parseResult && selectedRows.length > 0) {
      // Performance optimization: Process in batches for large selections
      if (selectedRows.length > 100) {
        // Show processing indicator
        setIsProcessing(true);
        
        // Process in batches of 100
        const batchSize = 100;
        const totalBatches = Math.ceil(selectedRows.length / batchSize);
        
        // Process first batch immediately
        const firstBatch = selectedRows.slice(0, batchSize);
        onFileProcessed(parseResult, firstBatch);
        
        // Schedule remaining batches
        let batchIndex = 1;
        const processBatch = () => {
          if (batchIndex < totalBatches) {
            const start = batchIndex * batchSize;
            const end = Math.min(start + batchSize, selectedRows.length);
            const batch = selectedRows.slice(start, end);
            
            onFileProcessed(parseResult, batch);
            batchIndex++;
            
            // Schedule next batch
            setTimeout(processBatch, 100);
          } else {
            // All batches processed
            setIsProcessing(false);
          }
        };
        
        // Start batch processing
        setTimeout(processBatch, 100);
        return;
      }
      
      // Normal processing for smaller selections
      onFileProcessed(parseResult, selectedRows)
    }
  }

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = [
      ['Product Name', 'Description', 'Price', 'Category', 'SKU'],
      ['Premium Wireless Headphones', 'High-quality noise-canceling headphones', '$199.99', 'Electronics', 'WH-001'],
      ['Organic Cotton T-Shirt', 'Comfortable organic cotton t-shirt', '$29.99', 'Fashion', 'TS-002'],
      ['Smart Home Speaker', 'Voice-controlled smart speaker', '$99.99', 'Electronics', 'SP-003']
    ]

    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'copyflow-sample.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Reset uploader
  const handleReset = () => {
    setParseResult(null)
    setSelectedRows([])
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Zone */}
      {!parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upload CSV File</span>
              <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive && !isDragReject && 'border-primary bg-primary/5 scale-105',
                isDragReject && 'border-destructive bg-destructive/5',
                disabled && 'opacity-50 cursor-not-allowed',
                !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
              )}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {isDragActive 
                      ? isDragReject 
                        ? 'File type not supported'
                        : 'Drop your CSV file here'
                      : 'Drag & drop your CSV file here'
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    or click to browse files
                  </p>
                </div>

                {/* File requirements */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-4">
                    <Badge variant="outline">CSV</Badge>
                    <Badge variant="outline">Excel</Badge>
                    <Badge variant="outline">TXT</Badge>
                  </div>
                  <p>Maximum file size: {fileSizeLimitMB}MB ({userPlan} plan)</p>
                </div>

                {/* Processing progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Processing file... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <ErrorMessage
          type="error"
          title="Upload Failed"
          message={error}
          actions={
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Again
            </Button>
          }
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* File Preview */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>File Preview</span>
                <Badge variant="success">
                  {parseResult.totalRows} rows
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          {showPreview && (
            <CardContent>
              {/* File info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Total Rows</div>
                  <div className="text-lg">{parseResult.totalRows}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Columns</div>
                  <div className="text-lg">{parseResult.headers.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">File Size</div>
                  <div className="text-lg">{formatFileSize(parseResult.fileSize)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Encoding</div>
                  <div className="text-lg">{parseResult.detectedEncoding}</div>
                </div>
              </div>

              {/* Product selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Select Products to Process</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedRows.length === parseResult.totalRows}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm">Select All</span>
                    </div>
                    <Badge variant="outline">
                      {selectedRows.length} selected
                    </Badge>
                  </div>
                </div>

                {/* Data table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">
                            <span className="sr-only">Select</span>
                          </th>
                          {parseResult.headers.map((header, index) => (
                            <th key={index} className="p-2 text-left text-sm font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.sampleData.slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t hover:bg-muted/25">
                            <td className="p-2">
                              <Checkbox
                                checked={selectedRows.includes(rowIndex)}
                                onCheckedChange={() => handleRowToggle(rowIndex)}
                              />
                            </td>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-sm max-w-32 truncate">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {parseResult.totalRows > 10 && (
                    <div className="p-3 bg-muted/25 text-center text-sm text-muted-foreground">
                      Showing first 10 rows of {parseResult.totalRows} total rows
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="mt-4">
                  <ErrorMessage
                    type="warning"
                    title="File Warnings"
                    message=""
                    details={parseResult.warnings}
                  />
                </div>
              )}

              {/* Process button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleProcessData}
                  disabled={selectedRows.length === 0}
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process {selectedRows.length} Products
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}