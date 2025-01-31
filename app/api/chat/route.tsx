import { NextRequest, NextResponse } from "next/server";
import handleMessageAbacus from "@/chatBot/chatBotRAG-Pinecone-Abacus";
import handleMessageDSG from "@/chatBot/chatBotRAG-Pinecone-DSG";
import handleMessageICT from "@/chatBot/chatBot-ICT";
import handleMessageBlog from "@/chatBot/chatBot-Blog-Generator"

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("POST Request:", body);

  const botStatus = body.botStatus;
  console.log("Bottype: " + body.botStatus)

  const content = body.messages.map((message: { content: any; }) => message.content).join(" ");
  let aiResponse = ""; 
  
  try {
    if (botStatus === "DSG") {
      aiResponse = await handleMessageDSG(content);
    }
    if (botStatus === "ICT") {
      aiResponse = await handleMessageICT(content);
    }
    if (botStatus === "abacus") {
      aiResponse = await handleMessageAbacus(content);
    }
    if (botStatus === "Blog") {
      aiResponse = await handleMessageBlog(content);
    }
    
    return NextResponse.json({ response: aiResponse }, { status: 200 });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}