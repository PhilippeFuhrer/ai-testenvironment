import { NextRequest, NextResponse } from "next/server";
import handleMessageAbacus from "@/chatBot/chatBot-LangGraph-Supabase";
import handleMessageDSG from "@/chatBot/chatBotRAG-Pinecone-DSG";
import handleMessageICT from "@/chatBot/chatBot-ICT";
import handleMessageBlog from "@/chatBot/chatBot-Blog-Generator";
import handleMessageEss from "@/chatBot/chatBot-ESS";
import handleMessageISMS from "@/chatBot/chat-Bot-ISMS";
import handleMessageISONorm from "@/chatBot/chat-Bot-ISO-Norm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("POST Request:", body);

  const botStatus = body.botStatus;
  console.log("Timestamp: " + new Date().toISOString());

  // Extrahiere die letzte Nachricht
  const userMessages = body.messages.filter((msg: any) => msg.role === "User");
  const lastUserMessage = userMessages[userMessages.length - 1].content;
  
  // Das Format sollte [userMessage, botResponse] 
  const chatHistory = [];
  for (let i = 0; i < userMessages.length - 1; i++) {
    const userMsg = userMessages[i];
    // Finde die entsprechende Bot-Antwort
    const botIndex = body.messages.findIndex((msg: any, idx: number) => 
      msg.role === "Arcon GPT" && 
      idx > body.messages.indexOf(userMsg) &&
      (i === userMessages.length - 2 || idx < body.messages.indexOf(userMessages[i+1]))
    );
    
    if (botIndex !== -1) {
      chatHistory.push([String(userMsg.content), String(body.messages[botIndex].content)] as [string, string]);
    }
  }

  let aiResponse = ""; 

  try {
    if (botStatus === "DSG") {
      aiResponse = await handleMessageDSG(lastUserMessage, chatHistory);
    }
    if (botStatus === "ICT") {
      aiResponse = await handleMessageICT(lastUserMessage, chatHistory);
    }
    if (botStatus === "Abacus") {
      aiResponse = await handleMessageAbacus(lastUserMessage, chatHistory);
    }
    if (botStatus === "Blog") {
      aiResponse = await handleMessageBlog(lastUserMessage, chatHistory);
    }
    if (botStatus === "ESS") {
      aiResponse = await handleMessageEss(lastUserMessage, chatHistory);
    }
    if (botStatus === "ISMS") {
      aiResponse = await handleMessageISMS(lastUserMessage, chatHistory);
    }
    if (botStatus === "ISONorm") {
      aiResponse = await handleMessageISONorm(lastUserMessage, chatHistory);
    }
    
    return NextResponse.json({ response: aiResponse }, { status: 200 });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}