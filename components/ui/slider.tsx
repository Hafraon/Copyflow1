import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  showValue?: boolean
  showMinMax?: boolean
  formatValue?: (value: number) => string
  size?: "sm" | "default" | "lg"
  color?: "default" | "primary" | "secondary" | "destructive"
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ 
  className, 
  label, 
  showValue = false, 
  showMinMax = false, 
  formatValue = (value) => value.toString(),
  size = "default",
  color = "default",
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  ...props 
}, ref) => {
  const currentValue = value || defaultValue || [min]
  const displayValue = Array.isArray(currentValue) ? currentValue[0] : currentValue

  const sizeClasses = {
    sm: "h-1",
    default: "h-2", 
    lg: "h-3"
  }

  const thumbSizeClasses = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const colorClasses = {
    default: "bg-primary",
    primary: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-destructive"
  }

  return (
    <div className="space-y-3">
      {/* Header with label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium leading-none">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-muted-foreground">
              {formatValue(displayValue)}
            </span>
          )}
        </div>
      )}

      {/* Slider */}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        {...props}
      >
        <SliderPrimitive.Track 
          className={cn(
            "relative w-full grow overflow-hidden rounded-full bg-secondary",
            sizeClasses[size]
          )}
        >
          <SliderPrimitive.Range 
            className={cn(
              "absolute h-full transition-all",
              colorClasses[color]
            )} 
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className={cn(
            "block rounded-full border-2 border-primary bg-background ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110",
            thumbSizeClasses[size]
          )}
        />
      </SliderPrimitive.Root>

      {/* Min/Max labels */}
      {showMinMax && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

// Range Slider for two values
export interface RangeSliderProps extends Omit<SliderProps, 'value' | 'defaultValue'> {
  value?: [number, number]
  defaultValue?: [number, number]
  formatRange?: (min: number, max: number) => string
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ 
  formatRange = (min, max) => `${min} - ${max}`,
  showValue = true,
  value,
  defaultValue = [0, 100],
  ...props 
}, ref) => {
  const currentValue = value || defaultValue
  const [minValue, maxValue] = currentValue

  return (
    <Slider
      ref={ref}
      value={currentValue}
      defaultValue={defaultValue}
      showValue={showValue}
      formatValue={() => formatRange(minValue, maxValue)}
      {...props}
    />
  )
})
RangeSlider.displayName = "RangeSlider"

export { Slider, RangeSlider }