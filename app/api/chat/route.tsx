import { NextResponse } from 'next/server';
import handleMessage from '@/chatBot';

export async function POST(request: { json: () => any; }) {
  const body = await request.json();
  console.log(body);
  var content = "";
  body.messages.forEach((message: { content: any; }) => {
    content = message.content;
  });
  console.log(content);
  const aiResponse = await handleMessage(content);
  return NextResponse.json({ response: aiResponse }, { status: 200 });
}