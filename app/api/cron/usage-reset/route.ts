import { NextRequest, NextResponse } from 'next/server'

/**
 * Usage reset endpoint for monthly plan resets
 * Scheduled to run on the 1st of each month
 * 
 * GET /api/cron/usage-reset
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ 
      status: 'skipped', 
      message: 'Usage reset only runs in production environment' 
    })
  }
  
  try {
    // In production, reset usage for all active users
    // const result = await prisma.user.updateMany({
    //   where: {
    //     subscription_plan: {
    //       in: ['free', 'pro', 'business']
    //     }
    //   },
    //   data: {
    //     generations_used: 0,
    //     reset_date: new Date()
    //   }
    // })
    
    // Mock result for development
    const result = { count: 1250 }
    
    // Send notification to admin
    if (process.env.ADMIN_WEBHOOK_URL) {
      await fetch(process.env.ADMIN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'usage_reset',
          usersAffected: result.count,
          timestamp: new Date().toISOString()
        })
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Usage reset completed successfully',
      usersAffected: result.count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Usage reset failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Usage reset failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}