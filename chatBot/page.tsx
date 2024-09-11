"use client";
import React, { useState } from "react";

type Message = {
  role: string;
  content: string;
};

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const newMessage = { role: "user", content: input };
    setMessages([...messages, newMessage]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [...messages, newMessage] }),
    });

    const data = await response.json();
    const aiMessage = { role: "assistant", content: data.response };

    setMessages([...messages, newMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="flex-row w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          className="w-full min-w-96 p-2 border border-gray-300 rounded shadow-xl text-2xl bg-white"
          value={input}
          placeholder="Hi, hier ist Arcon GPT, wie kann ich dir helfen?"
          onChange={handleInputChange}
        />
      </form>
      {messages.map((message, index) => (
        <div key={index} className="whitespace-pre-wrap text-white text-xl">
          <strong>{`${message.role}: `}</strong>
          {message.content}
          <br />
          <br />
        </div>
      ))}
    </div>
  );
};

export default ChatBot;
