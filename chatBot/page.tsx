"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/copyButton";

type Message = {
  role: string;
  content: string;
};

let botStatus = "abacus";

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBot, setSelectedBot] = useState("");

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInput(e.target.value);
  };

  const handleBotChange = async (botType: string) => {
    botStatus = botType;
    setSelectedBot(botType);
    console.log(botStatus);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);

    const newMessage = { role: "User", content: input };
    setMessages([...messages, newMessage]);

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

    setMessages([...messages, newMessage, aiMessage]);
    setLoading(false);
    setInput("");
  };

  //function to start a new conversation
  const newConversation = () => {
    setLoading(false);
    setMessages([]);
    setInput("");
  };

  //cleaningup response
  function cleanResponse(textToFormat: string) {
    const formattedText = textToFormat.replace(/\\n/g, "");

    return formattedText;
  }


  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="flex-grow p-4 pb-64">
        {messages.map((message, index) => (
          <div
            key={index}
            className="relative block whitespace-pre-wrap text-arcon-green text-xl mb-6 p-5 rounded-xl bg-slate-50 border-2 shadow-sm"
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
              {cleanResponse(message.content)}
            </ReactMarkdown>
            <CopyButton text={message.content}></CopyButton>
          </div>
          
        ))}
      </div>
      <div className="border-2 rounded-2xl bg-slate-100 p-4 fixed bottom-10 left-0 right-0 max-w-4xl mx-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            className="w-full p-3 border-2 hover:shadow-sm rounded-xl text-xl bg-white text-gray-900 mb-4"
            value={input}
            placeholder="Hi, hier ist Arcon GPT, wie kann ich dir helfen?"
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
                defaultValue=""
              >
                <option value="Abacus">Abacus Agent</option>
                <option value="ICT">ICT Agent</option>
                <option value="DSG">DSG Agent</option>
                <option value="Blog">Blog Agent</option>
                <option value="ESS">ESS Agent</option>
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
