import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X, Info, Sparkles, Globe, Palette, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextInputSchema, type TextInputFormData } from '@/lib/form-schemas'
import { CATEGORIES, WRITING_STYLES, LANGUAGES } from '@/lib/utils'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormSection 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/ui/error-message'

interface TextInputFormProps {
  onSubmit: (data: TextInputFormData) => Promise<void>
  defaultValues?: Partial<TextInputFormData>
  isLoading?: boolean
  className?: string
}

export const TextInputForm: React.FC<TextInputFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false,
  className
}) => {
  const [keyFeatures, setKeyFeatures] = React.useState<string[]>(defaultValues?.keyFeatures || [])
  const [newFeature, setNewFeature] = React.useState('')

  const form = useForm<TextInputFormData>({
    resolver: zodResolver(TextInputSchema),
    defaultValues: {
      productName: '',
      category: 'universal',
      productDescription: '',
      keyFeatures: [],
      writingStyle: 'professional',
      language: 'en',
      platforms: ['universal'],
      emojiIntensity: 'medium',
      includeEmojis: true,
      ...defaultValues
    }
  })

  const { handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form
  const watchedValues = watch()

  // Character count helpers
  const productNameLength = watchedValues.productName?.length || 0
  const descriptionLength = watchedValues.productDescription?.length || 0

  // SEO guidance
  const getSEOGuidance = (field: string, length: number) => {
    const guidance = {
      productName: {
        optimal: { min: 40, max: 60 },
        message: length < 40 ? 'Too short for SEO' : length > 60 ? 'Too long for SEO' : 'Perfect for SEO'
      },
      description: {
        optimal: { min: 150, max: 300 },
        message: length < 150 ? 'Add more details for better SEO' : length > 300 ? 'Consider shortening' : 'Good length'
      }
    }
    return guidance[field as keyof typeof guidance]
  }

  // Add key feature
  const addKeyFeature = () => {
    if (newFeature.trim() && keyFeatures.length < 10) {
      const updatedFeatures = [...keyFeatures, newFeature.trim()]
      setKeyFeatures(updatedFeatures)
      setValue('keyFeatures', updatedFeatures)
      setNewFeature('')
    }
  }

  // Remove key feature
  const removeKeyFeature = (index: number) => {
    const updatedFeatures = keyFeatures.filter((_, i) => i !== index)
    setKeyFeatures(updatedFeatures)
    setValue('keyFeatures', updatedFeatures)
  }

  // Handle form submission
  const onFormSubmit = async (data: TextInputFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const productNameGuidance = getSEOGuidance('productName', productNameLength)
  const descriptionGuidance = getSEOGuidance('description', descriptionLength)

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Single Product Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
              {/* Basic Product Information */}
              <FormSection 
                title="Basic Product Information"
                description="Essential details about your product"
              >
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required tooltip="The main title of your product that will appear in search results">
                        Product Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your product name..."
                          showCharacterCount
                          maxCharacters={100}
                          error={errors.productName?.message}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>This will be used as the base for all generated titles</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              productNameLength >= 40 && productNameLength <= 60 
                                ? "success" 
                                : "warning"
                            }
                            size="sm"
                          >
                            {productNameGuidance?.message}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {productNameLength}/100
                          </span>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required tooltip="Product category affects emoji selection and content optimization">
                        Category
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger error={errors.category?.message}>
                            <SelectValue placeholder="Select product category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{category.name}</span>
                                {category.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {category.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Category determines content optimization and emoji selection
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              {/* Product Details */}
              <FormSection 
                title="Product Details"
                description="Additional information to enhance content generation"
              >
                {/* Product Description */}
                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel tooltip="Optional description that provides context for better content generation">
                        Product Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product features, benefits, and unique selling points..."
                          showCharacterCount
                          maxCharacters={500}
                          autoResize
                          minRows={3}
                          maxRows={6}
                          error={errors.productDescription?.message}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Provide context for better AI content generation</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              descriptionLength >= 150 && descriptionLength <= 300 
                                ? "success" 
                                : descriptionLength > 0 ? "warning" : "secondary"
                            }
                            size="sm"
                          >
                            {descriptionGuidance?.message}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {descriptionLength}/500
                          </span>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Key Features */}
                <FormField
                  control={form.control}
                  name="keyFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel tooltip="List key features that make your product unique">
                        Key Features
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Add new feature */}
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add a key feature..."
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addKeyFeature()
                                }
                              }}
                              maxLength={200}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addKeyFeature}
                              disabled={!newFeature.trim() || keyFeatures.length >= 10}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Feature list */}
                          {keyFeatures.length > 0 && (
                            <div className="space-y-2">
                              {keyFeatures.map((feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                                >
                                  <span className="text-sm">{feature}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeKeyFeature(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Add up to 10 key features. Press Enter or click + to add.
                        <span className="ml-2 text-xs">
                          ({keyFeatures.length}/10)
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              {/* Content Settings */}
              <FormSection 
                title="Content Settings"
                description="Customize the style and language of generated content"
              >
                {/* Writing Style */}
                <FormField
                  control={form.control}
                  name="writingStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required tooltip="Writing style affects tone and vocabulary of generated content">
                        <Palette className="h-4 w-4 inline mr-1" />
                        Writing Style
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger error={errors.writingStyle?.message}>
                            <SelectValue placeholder="Select writing style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WRITING_STYLES.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{style.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {style.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines the tone and vocabulary of generated content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required tooltip="Language for all generated content">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Language
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger error={errors.language?.message}>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              <div className="flex items-center space-x-2">
                                <span>{language.flag}</span>
                                <span className="font-medium">{language.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {language.nativeName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        All generated content will be in this language
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Platform selection and emoji settings on next step</span>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  loading={isLoading || isSubmitting}
                  size="lg"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Continue to Platform Selection
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <ErrorMessage
          type="error"
          title="Please fix the following errors:"
          message=""
          details={Object.entries(errors).map(([field, error]) => 
            `${field}: ${error?.message}`
          )}
        />
      )}
    </div>
  )
}