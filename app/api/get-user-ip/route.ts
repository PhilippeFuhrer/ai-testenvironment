import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Try multiple headers to find the client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddr = request.ip; // Next.js 13+ has this property
  
  let clientIp = forwarded 
    ? forwarded.split(',')[0].trim() 
    : realIp 
      ? realIp 
      : remoteAddr || '::1';
      
  return Response.json({ ip: clientIp });
}