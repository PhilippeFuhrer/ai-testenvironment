import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the client's IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '';
  console.log("Client IP: " + ip);
  
  // Return the IP address
  return NextResponse.json({ ip });
}