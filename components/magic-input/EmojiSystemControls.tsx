import React from 'react'
import { Smile, Sparkles, Zap, Target, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EMOJI_INTENSITIES, CATEGORIES } from '@/lib/utils'
import { EmojiSettings } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface EmojiSystemControlsProps {
  settings: EmojiSettings
  onSettingsChange: (settings: EmojiSettings) => void
  selectedCategory?: string
  isBulkMode?: boolean
  className?: string
  disabled?: boolean
}

export const EmojiSystemControls: React.FC<EmojiSystemControlsProps> = ({
  settings,
  onSettingsChange,
  selectedCategory = 'universal',
  isBulkMode = false,
  className,
  disabled = false
}) => {
  // Emoji intensity examples
  const intensityExamples = {
    low: {
      count: '3-5',
      example: '✅ Quality 🚚 Fast',
      description: 'Minimal emojis for professional look'
    },
    medium: {
      count: '8-12', 
      example: '✅ Quality 🔥 Price 🚚 Delivery ⚡ Fast 💯 Guaranteed',
      description: 'Balanced emoji usage for engagement'
    },
    high: {
      count: '15-20',
      example: '✅🔥⚡💯🎯🚀💎✨🌟⭐🏆🎁🔋📱💝',
      description: 'Maximum emojis for viral social media content'
    }
  }

  // Category-specific emoji examples
  const categoryEmojis = {
    electronics: '📱💻⚡🔋📺🎮',
    fashion: '👗👠💄✨👜🌟',
    beauty: '💄💅✨🌸💖👑',
    home: '🏠🛋️🕯️🌿🖼️🛏️',
    sports: '⚽🏃‍♂️💪🏆🥇🎯',
    health: '💊🏥❤️🧘‍♀️🌱💚',
    automotive: '🚗🔧⛽🛣️🏁🚙',
    food: '🍕🥗🍰☕🍎🥘',
    travel: '✈️🏖️🗺️🎒🌍📸',
    toys: '🧸🎮🎲🎨🚀🎪',
    jewelry: '💎💍👑✨💫⭐',
    books: '📚📖✍️🎓📝📑',
    pets: '🐕🐱🐾❤️🎾🦴',
    business: '💼📊💰📈🎯💡',
    art: '🎨🖌️🖼️✨🌈🎭',
    music: '🎵🎸🎤🎹🎧🎼',
    universal: '✅🔥⚡💯🎯🚀'
  }

  const currentIntensity = settings.intensity
  const currentExample = intensityExamples[currentIntensity]
  const categorySpecificEmojis = categoryEmojis[selectedCategory as keyof typeof categoryEmojis] || categoryEmojis.universal

  // Slider value mapping
  const intensityToSliderValue = { low: 0, medium: 1, high: 2 }
  const sliderValueToIntensity = ['low', 'medium', 'high'] as const

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = sliderValueToIntensity[value[0]] || 'medium'
    onSettingsChange({
      ...settings,
      intensity: newIntensity
    })
  }

  const handleEmojiToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enabled
    })
  }

  const handleCategorySpecificToggle = (categorySpecific: boolean) => {
    onSettingsChange({
      ...settings,
      categorySpecific
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Global settings notice for bulk mode */}
      {isBulkMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Global Emoji Settings</h4>
                <p className="text-sm text-blue-700">
                  These settings apply to ALL products in bulk processing. Individual product customization is not available in bulk mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main emoji toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smile className="h-5 w-5" />
              <span>Emoji System</span>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleEmojiToggle}
              disabled={disabled}
              size="default"
            />
          </CardTitle>
        </CardHeader>
        
        {settings.enabled && (
          <CardContent className="space-y-6">
            {/* Intensity slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Emoji Intensity</label>
                <Badge variant="outline">
                  {currentExample.count} emojis
                </Badge>
              </div>
              
              <Slider
                value={[intensityToSliderValue[currentIntensity]]}
                onValueChange={handleIntensityChange}
                max={2}
                step={1}
                disabled={disabled}
                className="w-full"
              />
              
              {/* Intensity labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Live Preview</span>
              </h4>
              
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {currentExample.description}
                    </div>
                    <div className="text-base font-medium">
                      {currentExample.example}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Example with {currentExample.count} emojis
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category-specific toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Category-Specific Emojis</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Use emojis relevant to the product category
                  </p>
                </div>
                <Switch
                  checked={settings.categorySpecific}
                  onCheckedChange={handleCategorySpecificToggle}
                  disabled={disabled}
                  size="default"
                />
              </div>

              {settings.categorySpecific && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Category: <span className="capitalize font-medium">{selectedCategory}</span>
                      </div>
                      <div className="text-lg">
                        {categorySpecificEmojis}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Category-specific emojis will be mixed with general emojis
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Emoji counter display */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Expected Emoji Count</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{currentExample.count}</span>
                <span className="text-muted-foreground ml-1">per content piece</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(intensityExamples).map(([key, data]) => (
                  <Button
                    key={key}
                    variant={currentIntensity === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSettingsChange({ ...settings, intensity: key as any })}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <div className="text-center">
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-xs opacity-70">{data.count}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Settings summary */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Settings Summary</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Emojis Enabled</span>
                <Badge variant={settings.enabled ? "success" : "secondary"}>
                  {settings.enabled ? "ON" : "OFF"}
                </Badge>
              </div>
              {settings.enabled && (
                <>
                  <div className="flex justify-between">
                    <span>Intensity</span>
                    <Badge variant="outline" className="capitalize">
                      {settings.intensity} ({currentExample.count})
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Category-Specific</span>
                    <Badge variant={settings.categorySpecific ? "success" : "secondary"}>
                      {settings.categorySpecific ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}