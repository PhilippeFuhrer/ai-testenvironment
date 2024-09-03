import { NextResponse } from "next/server";
import handleMessage from "@/chatBot";

export async function POST(request: { json: () => any }) {
  const body = await request.json();
  console.log("POST Request " + body);
  var content = "";
  body.messages.forEach((message: { content: any }) => {
    content = message.content;
  });
  const aiResponse = await handleMessage(content);
  console.log(aiResponse)
  return NextResponse.json({ response: aiResponse }, { status: 200 });
}

