"use client";
import React, { useState } from "react";

type Message = {
  role: string;
  content: string;
};

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInput(e.target.value);
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
      body: JSON.stringify({ messages: [...messages, newMessage] }),
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

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="flex-grow p-4 pb-64">
        {messages.map((message, index) => (
          <div
            key={index}
            className="whitespace-pre-wrap text-arcon-green text-xl mb-6 p-5 rounded-xl bg-slate-50 border-2 shadow-sm"
          >
            <strong
              className={
                message.role === "Arcon GPT" ? "text-arcon-light-green" : "text-arcon-light-green"
              }
            >
              {`${message.role}: `}
            </strong>
            {message.content}
          </div>
        ))}
      </div>
      <div className="border-2 rounded-2xl bg-slate-100 p-4 fixed bottom-10 left-0 right-0 max-w-4xl mx-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            className="w-full p-3 border-2 hover:shadow-sm rounded-xl text-xl bg-white mb-4"
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
              className="btn bg-arcon-green text-slate-50 hover:text-white py-2 rounded-lg text-md"
              type="button"
              onClick={newConversation}
            >
              Neues Thema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;