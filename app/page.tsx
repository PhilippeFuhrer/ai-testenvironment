"use client";
import React, { useState } from "react";
import ChatHistorySidebar from "@/components/chatHistorySidebar";
import ChatBot from "@/components/chatBot";

// Define the agent greetings
const agentGreetings: Record<string, string> = {
  ESS: "Hi, ich bin der ESS Agent. Ich helfe dir, dich im ESS-Abo-Jungle zurecht zu finden und kalkuliere die Abo Kosten für dich.",
  Abacus:
    "Hi, ich bin der Abacus Agent. Ich verfüge über spezifisches Abacus Wissen und helfe dir gerne bei Abacus Supportanfragen.",
  ICT: "Hi, ich bin der ICT Agent. Ich stehe bereit, um dir bei IT- und Technologiefragen zu assistieren.",
  DSG: "Hi, ich bin der DSG Agent. Ich beantworte gerne deine Fragen zum neuen DSG.",
  Blog: "Hi, ich bin der Blog Agent. Ich erstelle dir SEO optimierte Blogs in der gewünschten Tonalität.",
  ISMS: "Hi, ich bin der ISMS Agent. Ich helfe dir bei Fragen rund um das ISMS."
};

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState("ESS");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBotChange = (botType: string) => {
    setSelectedBot(botType);
    // Clear selected conversation when changing bots
    setSelectedConversationId(null);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  return (
    <div className="flex h-screen bg-arcon-green">
      {/* Header with sidebar toggle */}
      <header className="fixed top-0 left-0 right-0 bg-arcon-green z-10 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left section with button */}
          <div className="w-1/3 flex justify-start">
            <button
              onClick={toggleSidebar}
              className="btn btn-ghost btn-circle text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Center section with title */}
          <div className="w-1/3 flex justify-center">
            <h1 className="text-xl font-bold text-white">Arcon GPT</h1>
          </div>

          {/* Right section with assistant info */}
          <div className="w-1/3 flex justify-end">
            <div className="text-sm text-gray-200">
              Aktiver Assistent:{" "}
              <span className="font-medium text-gray-200">{selectedBot}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar for chat history */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedBot={selectedBot}
        handleBotChange={handleBotChange}
        agentGreetings={agentGreetings}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
      />

      {/* Main chat area */}
      <main className="flex-1 pt-32 pb-20 px-4">
        <ChatBot
          selectedBot={selectedBot}
          handleBotChange={handleBotChange}
          agentGreetings={agentGreetings}
          selectedConversationId={selectedConversationId}
          onConversationCreated={handleConversationCreated}
        />
      </main>
    </div>
  );
}
