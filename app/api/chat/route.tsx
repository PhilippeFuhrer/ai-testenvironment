import { NextResponse } from "next/server";
import handleMessageAbacus from "@/chatBot/chatBotRAG-Pinecone";
import handleMessageDSG from "@/chatBot/chatBotRAG-Pinecone-DSG";

export async function POST(request: { json: () => any; }) {
  const body = await request.json();
  console.log("POST Request:", body);

  const botStatus = body.botStatus;
  console.log("Bottype: " + body.botStatus)

  const content = body.messages.map((message: { content: any; }) => message.content).join(" ");
  let aiResponse = ""; 
  
  try {
    if (botStatus === "DSG") {
      aiResponse = await handleMessageDSG(content);
    } else {
      aiResponse = await handleMessageAbacus(content);
    }
    
    console.log(aiResponse);
    
    return NextResponse.json({ response: aiResponse }, { status: 200 });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}