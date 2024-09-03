"use client";
import React, { useState } from "react";

type Message = {
  role: string;
  content: string;
};


const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("");

  const handleInputChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
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
    <div className="flex flex-col w-full max-w-md py-24 mx-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className="whitespace-pre-wrap"
          style={{ color: message.role === "user" ? "black" : "green" }}
        >
          <strong>{`${message.role}: `}</strong>
          {message.content}
          <br />
          <br />
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl text-2xl text-black"
          value={input}
          placeholder="Hi, hier ist Arcon GPT, wie kann ich dir helfen?"
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
};

export default ChatBot;

