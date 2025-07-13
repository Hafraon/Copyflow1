'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Zap, 
  Search, 
  Globe, 
  Upload, 
  Smartphone, 
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Shield,
  Crown,
  Sparkles,
  FileText,
  Target,
  Brain,
  Play,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const features = [
  {
    icon: Zap,
    title: "Magic Input",
    description: "Text, CSV, or URL - we handle any input method",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: Search,
    title: "Platform Intelligence", 
    description: "Auto-detect Shopify, Amazon, eBay, and optimize accordingly",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Native content generation in 11 languages",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    icon: Upload,
    title: "Export = Import",
    description: "Enhanced files seamlessly import back to your platform",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  {
    icon: Smartphone,
    title: "Viral Content",
    description: "TikTok hooks, Instagram captions, social media ready",
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  {
    icon: Brain,
    title: "Instant Processing",
    description: "AI-powered generation in under 30 seconds",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  }
]

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for testing",
    features: [
      "5 generations per month",
      "Universal platform only",
      "TXT export format",
      "Community support"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For growing businesses",
    features: [
      "500 generations per month",
      "All platforms (Universal + 4)",
      "All export formats",
      "Priority support",
      "CSV bulk processing"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Business",
    price: "$49", 
    period: "/month",
    description: "For enterprise teams",
    features: [
      "2000 generations per month",
      "Unlimited platforms",
      "API access",
      "White-label options",
      "Dedicated support"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "E-commerce Manager",
    company: "TechGadgets Store",
    content: "CopyFlow transformed our product descriptions. 300% increase in conversion rates!",
    rating: 5
  },
  {
    name: "Mike Rodriguez", 
    role: "Marketing Director",
    company: "Fashion Forward",
    content: "The export-import workflow is genius. Saves us 20 hours per week.",
    rating: 5
  },
  {
    name: "Anna Kowalski",
    role: "Store Owner",
    company: "Handmade Crafts",
    content: "Multi-language support helped us expand to 5 new markets effortlessly.",
    rating: 5
  }
]

const stats = [
  { label: "E-commerce Stores", value: "10,000+", icon: Users },
  { label: "Descriptions Generated", value: "250K+", icon: FileText },
  { label: "Languages Supported", value: "11", icon: Globe },
  { label: "Import Success Rate", value: "98%", icon: CheckCircle }
]

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState("Premium Wireless Headphones")
  const [demoOutput, setDemoOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Demo generation simulation
  const handleDemoGeneration = async () => {
    if (!demoInput.trim()) return
    
    setIsGenerating(true)
    setProgress(0)
    
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setDemoOutput(`🎧 ${demoInput} - Premium Sound Experience

Experience crystal-clear audio with our premium wireless headphones featuring advanced noise cancellation technology. Perfect for music lovers, professionals, and anyone seeking superior sound quality.

✅ 40-hour battery life
✅ Active noise cancellation  
✅ Premium comfort design
✅ Universal compatibility

🔥 Limited time offer - Free shipping worldwide!`)
    
    setIsGenerating(false)
  }

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CopyFlow</span>
            <Badge variant="outline" className="text-xs">AI-Powered</Badge>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">Demo</a>
            <LanguageSwitcher variant="compact" />
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Product Description Generator
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Export → Enhance → Import Back to Your Platform
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your platform exports into super-exports with AI-generated content. 
              Upload CSV, get enhanced CSV back with CopyFlow_ columns that seamlessly import.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6">
                <Zap className="mr-2 h-5 w-5" />
                Start Free → 5 Generations
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>98% import success rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>11 languages supported</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Magic Input Demo */}
      <section id="demo" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">See CopyFlow in Action</h2>
              <p className="text-lg text-muted-foreground">
                Enter any product name and watch AI generate professional content instantly
              </p>
            </div>
            
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Input */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Input
                  </h3>
                  <Input
                    placeholder="Enter product name..."
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    className="text-lg"
                  />
                  <Button 
                    onClick={handleDemoGeneration}
                    disabled={isGenerating || !demoInput.trim()}
                    className="w-full"
                    loading={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </Button>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        AI is analyzing and generating content...
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Output */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI-Generated Output
                  </h3>
                  <Textarea
                    value={demoOutput}
                    readOnly
                    placeholder="Generated content will appear here..."
                    className="min-h-[200px] text-sm"
                  />
                  {demoOutput && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Content generated successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Export=Import Value */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">The Export = Import Advantage</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Unlike other tools that create standalone content, CopyFlow enhances your existing workflow. 
                Export from your platform, enhance with AI, import back seamlessly.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Export Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Export your product catalog from Shopify, Amazon, or any platform as CSV
                </p>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">2. AI Enhancement</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI adds CopyFlow_ columns with optimized content while preserving originals
                </p>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Import Back</h3>
                <p className="text-sm text-muted-foreground">
                  Enhanced CSV imports seamlessly back to your platform with 98% success rate
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern E-commerce</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to create compelling product content at scale
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", feature.bgColor)}>
                      <Icon className={cn("h-6 w-6", feature.color)} />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Trusted by 10,000+ E-commerce Stores</h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of businesses already using CopyFlow to enhance their product content
              </p>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>
            
            {/* Testimonials */}
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground">
                Choose the plan that fits your business needs. Upgrade or downgrade anytime.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={index} className={cn(
                  "p-6 relative",
                  plan.popular && "border-primary shadow-lg scale-105"
                )}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Product Content?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of e-commerce stores already using CopyFlow to enhance their product descriptions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Schedule Demo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">CopyFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered product description generator for modern e-commerce.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CopyFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}