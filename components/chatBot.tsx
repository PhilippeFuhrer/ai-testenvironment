"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/copyButton";
import { addMessage, createConversation, getConversationMessages } from "@/supabase";

type Message = {
  role: string;
  content: string;
};

type ChatBotProps = {
  selectedBot: string;
  handleBotChange: (botType: string) => void;
  agentGreetings: Record<string, string>;
  selectedConversationId: string | null;
  onConversationCreated: (conversationId: string) => void;

};

// We need access to botStatus for the API calls, so we keep it outside the component
let botStatus = "ESS";

const ChatBot: React.FC<ChatBotProps> = ({
  selectedBot,
  handleBotChange,
  agentGreetings,
  selectedConversationId,
  onConversationCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Update botStatus when selectedBot changes
    botStatus = selectedBot;
  }, [selectedBot]);

   // Load conversation when selectedConversationId changes
   useEffect(() => {
    const loadConversation = async () => {
      // Only attempt to load if we have a conversation ID and it's different from current
      if (selectedConversationId && selectedConversationId !== currentConversationId) {
        setLoading(true);
        try {
          console.log("Loading conversation:", selectedConversationId);
          const conversationMessages = await getConversationMessages(selectedConversationId);
          
          if (conversationMessages && conversationMessages.length > 0) {
            setMessages(conversationMessages);
            setCurrentConversationId(selectedConversationId);
          }
        } catch (error) {
          console.error("Error loading conversation:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadConversation();
  }, [selectedConversationId]);

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);

    const userContent = input;
    const newMessage = { role: "User", content: userContent };
    setMessages([...messages, newMessage]);

    // Create/get conversation ID and save user message
    let conversationId = currentConversationId;
    if (!conversationId) {
      // Create a new conversation
      const title = userContent.length > 30 ? `${userContent.substring(0, 27)}...` : userContent;
      try {
        const conversation = await createConversation(title, botStatus);
        
        if (conversation && conversation.id) {
          conversationId = conversation.id;
          setCurrentConversationId(conversationId);
          console.log("New conversation created:", conversationId);
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    }
    
    // Now save the user message with the confirmed conversation ID
    if (conversationId) {
      try {
        await addMessage(conversationId, "user", userContent);
        console.log("User message saved to conversation:", conversationId);
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    // Get AI response
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          botStatus: botStatus,
        }),
      });

      const data = await response.json();
      const aiMessage = { role: "Arcon GPT", content: data.response };

      // Save AI response using the same conversation ID
      if (conversationId) {
        await addMessage(conversationId, "assistant", data.response);
        console.log("AI message saved to conversation:", conversationId);
      }

      setMessages([...messages, newMessage, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Add a failure message to the UI
      setMessages([
        ...messages, 
        newMessage, 
        { role: "Arcon GPT", content: "Es tut mir leid, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später noch einmal." }
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // Function to start a new conversation
  const newConversation = () => {
    setLoading(false);
    setMessages([]);
    setInput("");
    setCurrentConversationId(null);
    
    // Directly set the greeting for the current bot type
    setTimeout(() => {
      const botGreeting = {
        role: "Arcon GPT",
        content: agentGreetings[selectedBot as keyof typeof agentGreetings],
      };
      
      setMessages([botGreeting]);
    }, 300);
  };

  // Display initial greeting when the component mounts or selectedBot changes
  // Only show greeting if no conversation is selected
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setCurrentConversationId(null);

      setTimeout(() => {
        const initialGreeting = {
          role: "Arcon GPT",
          content: agentGreetings[selectedBot as keyof typeof agentGreetings],
        };
        setMessages([initialGreeting]);
      }, 300);
    }
  }, [selectedBot, selectedConversationId]);

  return (
    <div className="flex flex-col max-w-4xl min-w-96 mx-auto">
      <div className="flex-grow p-4 pb-64">
        {messages.map((message, index) => (
          <div
            key={index}
            className="relative block whitespace-pre-wrap text-arcon-green text-xl mb-6 p-5 rounded-xl bg-slate-50 border-2 shadow-sm message-fade-in"
          >
            <p className="text-arcon-light-green mb-2 font-semibold">
              {`${message.role}: `}
            </p>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <table
                    style={{ width: "100%", borderCollapse: "collapse" }}
                    {...props}
                  />
                ),
                th: ({ node, ...props }) => (
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      textAlign: "left",
                    }}
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    style={{ border: "1px solid black", padding: "8px" }}
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    style={{
                      margin: "0px",
                      lineHeight: "0",
                      height: "auto",
                    }}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    style={{
                      margin: "0px",
                      lineHeight: "0",
                      height: "auto",
                    }}
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    style={{
                      margin: "8px 0px",
                      lineHeight: "1.5",
                      height: "auto",
                    }}
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            <CopyButton text={message.content}></CopyButton>
          </div>
        ))}
      </div>

      {/* Chat input */}
      <div className="border-2 rounded-2xl bg-slate-100 p-4 fixed bottom-10 left-0 right-0 max-w-4xl mx-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            className="w-full p-3 border-2 hover:shadow-sm rounded-xl text-xl bg-white text-gray-900 mb-4"
            value={input}
            onChange={handleInputChange}
            rows={3}
          />
          <div className="flex space-x-4">
            <button
              type="submit"
              className="btn bg-arcon-light-green border-none text-slate-50 px-4 py-2 rounded-lg text-md"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Los geht's!"
              )}
            </button>
            <button
              className="btn bg-arcon-green text-slate-50 hover:text-white py-2 rounded-lg text-sm font-semibold border-none"
              type="button"
              onClick={newConversation}
            >
              Neues Thema
            </button>
            <div className="relative">
              <select
                className="appearance-none w-full bg-gray-500 text-slate-50 text-sm font-semibold py-3.5 px-4 hover:bg-black ease-in-out duration-200 rounded-lg mr-4 focus:outline-none"
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  handleBotChange(selectedValue);
                }}
                value={selectedBot}
              >
                <option value="ESS">ESS Agent</option>
                <option value="Abacus">Abacus Agent</option>
                <option value="ICT">ICT Agent</option>
                <option value="DSG">DSG Agent</option>
                <option value="Blog">Blog Agent</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-50">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;