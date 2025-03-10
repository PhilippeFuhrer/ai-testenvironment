"use client";
import ChatBot from "@/components/chatBot";
import ChatHistorySidebar from "@/components/chatHistorySidebar";
import { SetStateAction, useEffect, useState } from "react";


// Agent greeting messages
const agentGreetings = {
  Abacus: "Hi, ich bin der Abacus Agent. Ich verfüge über spezifisches Abacus Wissen und helfe dir gerne bei Abacus Supportanfragen.",
  ICT: "Hi, ich bin der ICT Agent. Ich stehe bereit, um dir bei IT- und Technologiefragen zu assistieren.",
  DSG: "Hi, ich bin der DSG Agent. Ich beantworte gerne deine Fragen zum neuen DSG.",
  Blog: "Hi, ich bin der Blog Agent. Ich erstelle dir SEO optimierte Blogs in der gewünschten Tonalität.",
  ESS: "Hi, ich bin der ESS Agent. Ich helfe dir, dich im ESS-Abo-Jungle zurecht zu finden und kalkuliere die Abo Kosten für dich."
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState("ESS");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle bot change function to pass to both components
  const handleBotChange = (botType: SetStateAction<string>) => {
    // Clear the selected conversation when changing bots
    setSelectedConversationId(null);
    setSelectedBot(botType);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  // Handle new conversation creation
  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };
  
  // Close sidebar when escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: { key: string; }) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [sidebarOpen]);

  return (
    <main className="min-h-screen bg-arcon-green">
      <div className="navbar bg-arcon-green text-white">
        <div className="navbar-start w-1/3">
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-circle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
        </div>
        <div className="navbar-center w-1/3 flex justify-center">
          <a className="btn btn-ghost text-xl">Arcon GPT</a>
        </div>
      </div>
      
      <ChatHistorySidebar 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedBot={selectedBot}
        handleBotChange={handleBotChange}
        agentGreetings={agentGreetings}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
      />
      
      <div className="flex justify-center py-24">
        <ChatBot 
          selectedBot={selectedBot}
          handleBotChange={handleBotChange}
          agentGreetings={agentGreetings}
          selectedConversationId={selectedConversationId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </main>
  );
}