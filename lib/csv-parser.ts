import { UserPlanType } from './types'

// ============================================================================
// CSV PARSING INFRASTRUCTURE - Pure CSV Processing
// ============================================================================

export interface ColumnType {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url'
  sampleValues: string[]
  nullCount: number
  confidence: number // 0-100
}

export interface CSVParseResult {
  success: boolean
  headers: string[]
  sampleData: any[][]
  totalRows: number
  detectedEncoding: string
  columnTypes: ColumnType[]
  fileSize: number
  processingTime: number
  error?: string
  warnings: string[]
}

export interface CSVParseOptions {
  delimiter?: string
  quote?: string
  escape?: string
  skipEmptyLines?: boolean
  skipFirstRow?: boolean
  maxSampleRows?: number
  encoding?: string
}

// File size limits based on plan
const FILE_SIZE_LIMITS = {
  free: 10 * 1024 * 1024,      // 10MB
  pro: 50 * 1024 * 1024,       // 50MB
  business: 200 * 1024 * 1024   // 200MB
} as const

// Supported file types
const SUPPORTED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Common CSV delimiters
const COMMON_DELIMITERS = [',', ';', '\t', '|']

/**
 * Main CSV parsing function
 */
export async function parseCSV(
  file: File, 
  userPlan: UserPlanType = 'free',
  options: CSVParseOptions = {},
  onProgress?: (progress: number) => void
): Promise<CSVParseResult> {
  const startTime = Date.now()
  
  try {
    // Validate file
    const validation = validateFile(file, userPlan)
    if (!validation.valid) {
      return {
        success: false,
        headers: [],
        sampleData: [],
        totalRows: 0,
        detectedEncoding: 'unknown',
        columnTypes: [],
        fileSize: file.size,
        processingTime: Date.now() - startTime,
        error: validation.error,
        warnings: []
      }
    }

    onProgress?.(10)

    // Detect encoding
    const encoding = await detectEncoding(file)
    onProgress?.(20)

    // Read file content
    const content = await readFileContent(file, encoding)
    onProgress?.(40)

    // Detect delimiter
    const delimiter = options.delimiter || detectDelimiter(content)
    onProgress?.(50)

    // Parse CSV content
    const parseResult = parseCSVContent(content, {
      ...options,
      delimiter
    })
    onProgress?.(70)

    // Analyze columns
    const columnTypes = analyzeColumns(parseResult.headers, parseResult.data)
    onProgress?.(90)

    // Prepare sample data (first 10 rows)
    const maxSampleRows = options.maxSampleRows || 10
    const sampleData = parseResult.data.slice(0, maxSampleRows)

    onProgress?.(100)

    return {
      success: true,
      headers: parseResult.headers,
      sampleData,
      totalRows: parseResult.data.length,
      detectedEncoding: encoding,
      columnTypes,
      fileSize: file.size,
      processingTime: Date.now() - startTime,
      warnings: parseResult.warnings
    }

  } catch (error) {
    return {
      success: false,
      headers: [],
      sampleData: [],
      totalRows: 0,
      detectedEncoding: 'unknown',
      columnTypes: [],
      fileSize: file.size,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      warnings: []
    }
  }
}

/**
 * Validate file before processing
 */
function validateFile(file: File, userPlan: UserPlanType): { valid: boolean; error?: string } {
  // Check file type
  const isValidType = SUPPORTED_MIME_TYPES.includes(file.type) || 
                     file.name.toLowerCase().endsWith('.csv') ||
                     file.name.toLowerCase().endsWith('.txt')
  
  if (!isValidType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a CSV file.'
    }
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[userPlan]
  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024))
    return {
      valid: false,
      error: `File size exceeds ${sizeMB}MB limit for ${userPlan} plan. Please upgrade or use a smaller file.`
    }
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please upload a file with data.'
    }
  }

  return { valid: true }
}

/**
 * Detect file encoding
 */
async function detectEncoding(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer
      const bytes = new Uint8Array(buffer.slice(0, 1024)) // Check first 1KB
      
      // Check for BOM
      if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        resolve('utf-8')
        return
      }
      
      // Simple heuristic for encoding detection
      let hasHighBytes = false
      for (let i = 0; i < Math.min(bytes.length, 512); i++) {
        if (bytes[i] > 127) {
          hasHighBytes = true
          break
        }
      }
      
      // If no high bytes, assume UTF-8
      if (!hasHighBytes) {
        resolve('utf-8')
        return
      }
      
      // Try to detect Windows-1251 (Cyrillic)
      const decoder1251 = new TextDecoder('windows-1251', { fatal: false })
      const sample1251 = decoder1251.decode(bytes.slice(0, 256))
      
      // Check for common Cyrillic characters
      const cyrillicPattern = /[а-яё]/i
      if (cyrillicPattern.test(sample1251)) {
        resolve('windows-1251')
        return
      }
      
      // Default to UTF-8
      resolve('utf-8')
    }
    
    reader.onerror = () => resolve('utf-8')
    reader.readAsArrayBuffer(file.slice(0, 1024))
  })
}

/**
 * Read file content with specified encoding
 */
async function readFileContent(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      try {
        let content = reader.result as string
        
        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1)
        }
        
        resolve(content)
      } catch (error) {
        reject(new Error('Failed to read file content'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    
    // Use encoding-specific reading
    if (encoding === 'windows-1251') {
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer
          const decoder = new TextDecoder('windows-1251')
          const content = decoder.decode(buffer)
          resolve(content)
        } catch (error) {
          reject(new Error('Failed to decode file with Windows-1251 encoding'))
        }
      }
    } else {
      reader.readAsText(file, encoding)
    }
  })
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n') // First 5 lines
  const counts: Record<string, number> = {}
  
  // Count occurrences of each delimiter
  for (const delimiter of COMMON_DELIMITERS) {
    counts[delimiter] = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
  }
  
  // Find delimiter with highest count
  let bestDelimiter = ','
  let maxCount = 0
  
  for (const [delimiter, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      bestDelimiter = delimiter
    }
  }
  
  return bestDelimiter
}

/**
 * Parse CSV content into structured data
 */
function parseCSVContent(
  content: string, 
  options: CSVParseOptions
): { headers: string[]; data: string[][]; warnings: string[] } {
  const {
    delimiter = ',',
    quote = '"',
    escape = '"',
    skipEmptyLines = true,
    skipFirstRow = false
  } = options

  const warnings: string[] = []
  const lines = content.split(/\r?\n/)
  const result: string[][] = []
  
  let inQuotes = false
  let currentField = ''
  let currentRow: string[] = []
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    
    // Skip empty lines if requested
    if (skipEmptyLines && line.trim() === '' && !inQuotes) {
      continue
    }
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escaped quote
          currentField += quote
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        currentRow.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    // End of line
    if (!inQuotes) {
      currentRow.push(currentField.trim())
      result.push(currentRow)
      currentRow = []
      currentField = ''
    } else {
      // Multi-line field
      currentField += '\n'
    }
  }
  
  // Handle unclosed quotes
  if (inQuotes) {
    warnings.push('Unclosed quotes detected in CSV file')
    currentRow.push(currentField.trim())
    result.push(currentRow)
  }
  
  // Extract headers and data
  let headers: string[] = []
  let data: string[][] = []
  
  if (result.length > 0) {
    if (skipFirstRow && result.length > 1) {
      data = result.slice(1)
      headers = result[0].map((h, i) => h || `Column ${i + 1}`)
    } else {
      // Auto-detect if first row is headers
      const firstRow = result[0]
      const isHeaderRow = firstRow.every(cell => 
        isNaN(Number(cell)) && cell.trim() !== ''
      )
      
      if (isHeaderRow && result.length > 1) {
        headers = firstRow.map((h, i) => h || `Column ${i + 1}`)
        data = result.slice(1)
      } else {
        headers = firstRow.map((_, i) => `Column ${i + 1}`)
        data = result
      }
    }
  }
  
  // Validate data consistency
  if (data.length > 0) {
    const expectedColumns = headers.length
    const inconsistentRows = data.filter(row => row.length !== expectedColumns)
    
    if (inconsistentRows.length > 0) {
      warnings.push(`${inconsistentRows.length} rows have inconsistent column count`)
    }
  }
  
  return { headers, data, warnings }
}

/**
 * Analyze column types and characteristics
 */
function analyzeColumns(headers: string[], data: string[][]): ColumnType[] {
  const columnTypes: ColumnType[] = []
  
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const columnName = headers[colIndex]
    const values = data.map(row => row[colIndex] || '').filter(v => v.trim() !== '')
    const sampleValues = values.slice(0, 10) // First 10 non-empty values
    const nullCount = data.length - values.length
    
    // Detect column type
    const type = detectColumnType(values)
    const confidence = calculateTypeConfidence(values, type)
    
    columnTypes.push({
      name: columnName,
      type,
      sampleValues,
      nullCount,
      confidence
    })
  }
  
  return columnTypes
}

/**
 * Detect column data type
 */
function detectColumnType(values: string[]): ColumnType['type'] {
  if (values.length === 0) return 'text'
  
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    date: /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/,
    number: /^-?\d*\.?\d+$/,
    boolean: /^(true|false|yes|no|1|0)$/i
  }
  
  const typeScores = {
    email: 0,
    url: 0,
    date: 0,
    number: 0,
    boolean: 0,
    text: 0
  }
  
  // Test each value against patterns
  for (const value of values.slice(0, 100)) { // Test first 100 values
    const trimmed = value.trim()
    
    if (patterns.email.test(trimmed)) typeScores.email++
    else if (patterns.url.test(trimmed)) typeScores.url++
    else if (patterns.date.test(trimmed)) typeScores.date++
    else if (patterns.number.test(trimmed)) typeScores.number++
    else if (patterns.boolean.test(trimmed)) typeScores.boolean++
    else typeScores.text++
  }
  
  // Find type with highest score
  const maxScore = Math.max(...Object.values(typeScores))
  const detectedType = Object.entries(typeScores).find(([_, score]) => score === maxScore)?.[0] as ColumnType['type']
  
  return detectedType || 'text'
}

/**
 * Calculate confidence score for detected type
 */
function calculateTypeConfidence(values: string[], type: ColumnType['type']): number {
  if (values.length === 0) return 0
  
  const sampleSize = Math.min(values.length, 100)
  const sample = values.slice(0, sampleSize)
  
  let matches = 0
  
  for (const value of sample) {
    const trimmed = value.trim()
    
    switch (type) {
      case 'email':
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) matches++
        break
      case 'url':
        if (/^https?:\/\/.+/.test(trimmed)) matches++
        break
      case 'date':
        if (/^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/.test(trimmed)) matches++
        break
      case 'number':
        if (/^-?\d*\.?\d+$/.test(trimmed)) matches++
        break
      case 'boolean':
        if (/^(true|false|yes|no|1|0)$/i.test(trimmed)) matches++
        break
      default:
        matches++ // Text always matches
    }
  }
  
  return Math.round((matches / sampleSize) * 100)
}

/**
 * Get file size limit for user plan
 */
export function getFileSizeLimit(userPlan: UserPlanType): number {
  return FILE_SIZE_LIMITS[userPlan]
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate CSV headers for common issues
 */
export function validateCSVHeaders(headers: string[]): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check for empty headers
  const emptyHeaders = headers.filter(h => !h.trim())
  if (emptyHeaders.length > 0) {
    issues.push(`${emptyHeaders.length} columns have empty headers`)
  }
  
  // Check for duplicate headers
  const duplicates = headers.filter((h, i) => headers.indexOf(h) !== i)
  if (duplicates.length > 0) {
    issues.push(`Duplicate headers found: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  // Check for very long headers
  const longHeaders = headers.filter(h => h.length > 50)
  if (longHeaders.length > 0) {
    issues.push(`${longHeaders.length} headers are very long (>50 characters)`)
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Export utilities for CSV processing
 */
export const CSVUtils = {
  parseCSV,
  validateFile,
  detectEncoding,
  detectDelimiter,
  analyzeColumns,
  getFileSizeLimit,
  formatFileSize,
  validateCSVHeaders,
  SUPPORTED_MIME_TYPES,
  FILE_SIZE_LIMITS
} as const