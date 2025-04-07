"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/copyButton";
import {
  addMessage,
  createConversation,
  getConversationById,
  getConversationMessages,
} from "@/supabase";
import { Plus, SendIcon } from "lucide-react";

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
      if (
        selectedConversationId &&
        selectedConversationId !== currentConversationId
      ) {
        setLoading(true);
        try {
          console.log("Loading conversation:", selectedConversationId);

          // First get the conversation details to update the bot type
          const conversation = await getConversationById(
            selectedConversationId
          );
          if (conversation && conversation.bot_type) {
            // Update the selected bot in the parent component
            handleBotChange(conversation.bot_type);
          }

          const conversationMessages = await getConversationMessages(
            selectedConversationId
          );

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
  }, [selectedConversationId, handleBotChange]);

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    const textarea = e.target as HTMLTextAreaElement;
    setInput(textarea.value);
    
    // Auto-resize logic
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);

    const userContent = input;
    setInput("");

    const newMessage = { role: "User", content: userContent };
    setMessages([...messages, newMessage]);

    // Create/get conversation ID and save user message
    let conversationId = currentConversationId;
    if (!conversationId) {
      // Create a new conversation
      const title =
        userContent.length > 30
          ? `${userContent.substring(0, 27)}...`
          : userContent;
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
        {
          role: "Arcon GPT",
          content:
            "Es tut mir leid, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später noch einmal.",
        },
      ]);
    } finally {
      setLoading(false);
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
    if (!currentConversationId) {
      setMessages([]);

      setTimeout(() => {
        const initialGreeting = {
          role: "Arcon GPT",
          content: agentGreetings[selectedBot as keyof typeof agentGreetings],
        };
        setMessages([initialGreeting]);
      }, 300);
    }
  }, [selectedBot]);

  // Scroll to the bottom of the chat when new messages are added
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col max-w-4xl min-w-96 mx-auto">
      <div className="flex-grow p-4 pb-40">
        {messages.map((message, index) => (
          <div
            key={index}
            className="relative block text-arcon-green text-xl mb-6 p-5 rounded-xl bg-slate-50 border-2 shadow-sm message-fade-in"
          >
            <p className="text-arcon-light-green font-semibold">
              {`${message.role}: `}
            </p>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p
                    style={{
                      marginTop: "10px",
                    }}
                    {...props}
                  />
                ),
                h1: ({ node, ...props }) => (
                  <h1
                    style={{
                      fontSize: "24px",
                      marginTop: "30px",
                      marginBottom: "20px",
                      fontWeight: "bold",
                    }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    style={{
                      fontSize: "24px",
                      marginTop: "30px",
                      marginBottom: "20x",
                      fontWeight: "bold",
                    }}
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    style={{
                      fontSize: "24px",
                      marginTop: "30px",
                      fontWeight: "bold",
                      marginBottom: "20px",
                    }}
                    {...props}
                  />
                ),
                h4: ({ node, ...props }) => (
                  <h4
                    style={{
                      fontSize: "22px",
                      marginTop: "30px",
                      marginBottom: "20px",
                      fontWeight: "bold",
                    }}
                    {...props}
                  />
                ),
                table: ({ node, ...props }) => (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "16px",
                      marginBottom: "16px",
                    }}
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
                      marginTop: "2px",
                      marginBottom: "30px",
                      height: "auto",
                    }}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    style={{
                      marginTop: "2px",
                      marginBottom: "30px",
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
                code: ({ node, ...props }) => (
                  <code
                    style={{
                      margin: "12px 0",
                      padding: "16px",
                      height: "auto",
                      wordBreak: "break-all",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                      maxWidth: "100%",
                      display: "block",
                      backgroundColor: "#1e1e2e", // Dark background
                      borderRadius: "12px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      color: "#e2e8f0", // Light text
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                      border: "2px solid #2d2d3a", // Subtle border
                      lineHeight: "1.5",
                      position: "relative",
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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="rounded-2xl bg-white p-4 fixed bottom-6 left-0 right-0 max-w-4xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative">
            <textarea
              className="w-full p-4 rounded-xl text-gray-800 min-h-[30px] max-h-[200px] resize-none pr-12 focus:outline-none bg-gray-100"
              value={input}
              onChange={handleInputChange}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`absolute right-4 bottom-4 p-2 rounded-lg ${
                input.trim() && !loading
                  ? "bg-arcon-light-green text-white hover:bg-arcon-green"
                  : "bg-gray-200 text-gray-500"
              } transition-colors`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <SendIcon size={20} />
              )}
            </button>
          </div>

          <div className="flex items-center mt-1 gap-4">
            <div className="flex flex-row">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                type="button"
                onClick={newConversation}
              >
                <Plus size={16} />
                Neues Thema
              </button>
            </div>

            <div className="relative inline-block">
              <select
                className="appearance-none bg-arcon-light-green text-white text-sm font-medium py-2 px-4 pr-8 rounded-lg focus:outline-none hover:bg-gray-800 transition-colors min-w-max whitespace-nowrap"
                onChange={(e) => handleBotChange(e.target.value)}
                value={selectedBot}
              >
                <option value="ESS">ESS Agent</option>
                <option value="Abacus">Abacus Agent</option>
                <option value="ICT">ICT Agent</option>
                <option value="DSG">DSG Agent</option>
                <option value="Blog">Blog Agent</option>
                <option value="ISMS">ISMS Agent</option>
                <option value="ISONorm">ISO-Norm Agent</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M7 10l5 5 5-5H7z"></path>
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
