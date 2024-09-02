"use client";
import React from "react";
import { useChat } from "ai/react";

const chatBot = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto">
      {messages.map((message) => (
        <div
          key={message.id}
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
          className="w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl text-2xl"
          value={input}
          placeholder="Hi, hier ist Arcon GPT, wie kann ich dir helfen?"
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
};

export default chatBot;
