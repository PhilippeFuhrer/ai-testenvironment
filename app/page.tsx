"use client";
import React, { useState } from 'react';
import ChatHistorySidebar from "@/components/chatHistorySidebar";
import ChatBot from "@/components/chatBot";

// Define the agent greetings
const agentGreetings: Record<string, string> = {
  'ESS': 'Hallo, ich bin der ESS Assistant. Wie kann ich dir helfen?',
  'Abacus': 'Hallo, ich bin der Abacus Assistant. Wie kann ich dir mit Abacus-Fragen helfen?',
  'ICT': 'Hallo, ich bin der ICT Assistant. Wie kann ich dir mit IT-Fragen helfen?',
  'DSG': 'Hallo, ich bin der DSG Assistant. Wie kann ich dir mit Datenschutzfragen helfen?',
  'Blog': 'Hallo, ich bin der Blog Assistant. Wie kann ich dir bei Content-Erstellung helfen?',
};

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState('ESS');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
    <div className="flex h-screen bg-gray-100">
      {/* Header with sidebar toggle */}
      <header className="fixed top-0 left-0 right-0 bg-arcon-green shadow-sm z-10 px-4 py-2">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="btn btn-ghost btn-circle"
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
          <h1 className="text-xl font-bold text-white
           ml-4">Arcon GPT</h1>
          <div className="ml-auto text-sm text-gray-200">
            Aktiver Assistent: <span className="font-medium text-gray-200">{selectedBot}</span>
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
      <main className="flex-1 pt-20 pb-20 px-4">
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