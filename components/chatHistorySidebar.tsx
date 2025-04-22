"use client";
import React, { useEffect, useState } from "react";
import { Conversation, getConversations, formatChatDate } from "@/supabase";

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
  selectedBot: string;
  handleBotChange: (botType: string) => void;
  agentGreetings: Record<string, string>;
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
};

const ChatHistorySidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  selectedBot,
  handleBotChange,
  agentGreetings,
  selectedConversationId,
  onConversationSelect,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch conversations when the sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black z-20 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-arcon-green">Chat Verlauf</h2>
            <button
              onClick={toggleSidebar}
              className="btn btn-ghost btn-circle text-gray-500"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-6">
            {/* Chat History - Real data from Supabase */}
            {loading ? (
              <div className="space-y-4">
                <div className="border-l-4 border-gray-300 pl-3 py-2">
                  <p className="text-sm text-gray-500">Lade Gespräche...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="space-y-4">
                <div className="border-l-4 border-gray-300 pl-3 py-2">
                  <p className="text-sm text-gray-500">Keine Gespräche gefunden</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.slice(0, 5).map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => { onConversationSelect(conversation.id); toggleSidebar(); }}
                    className={`border-l-4 ${
                      selectedConversationId === conversation.id
                        ? "border-arcon-green"
                        : new Date(conversation.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                        ? "border-arcon-light-green"
                        : "border-gray-300"
                    } pl-3 py-2 hover:bg-gray-50 cursor-pointer`}
                  >
                    <p className="text-sm text-gray-500">
                      {formatChatDate(conversation.updated_at)}
                    </p>
                    <h4 className="font-medium text-arcon-green truncate">
                      {conversation.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {conversation.bot_type} Agent
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-3">Assistenten</h3>
              {Object.keys(agentGreetings).map((botType) => (
                <button
                  key={botType}
                  onClick={() => {
                    handleBotChange(botType);
                    toggleSidebar();
                  }}
                  className={`w-full text-left font-medium px-3 py-2 rounded-lg my-1 transition-colors ${
                    selectedBot === botType
                      ? "bg-arcon-light-green text-white"
                      : "text-arcon-green hover:bg-arcon-green hover:bg-opacity-10"
                  }`}
                >
                  {botType} Agent
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;