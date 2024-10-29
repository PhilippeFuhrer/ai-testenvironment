import { NextResponse } from "next/server";
import handleMessage from "@/chatBot/chatBotRAG-Pinecone";

export async function POST(request: { json: () => any; }) {
  const body = await request.json();
  console.log("POST Request", body);

  const content = body.messages.map((message: { content: any; }) => message.content).join(" ");
  const aiResponse = await handleMessage(content);
  console.log(aiResponse);

  return NextResponse.json({ response: aiResponse }, { status: 200 });
}

