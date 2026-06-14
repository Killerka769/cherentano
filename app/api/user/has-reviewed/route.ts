import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ hasReviewed: false, review: null })
    }
    
    const review = await prisma.review.findFirst({
      where: { userId: user.id }
    })
    
    return NextResponse.json({ 
      hasReviewed: !!review,
      review: review || null
    })
  } catch (error) {
    console.error('Error checking has reviewed:', error)
    return NextResponse.json({ hasReviewed: false, review: null })
  }
}