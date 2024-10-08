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
    <div className="flex-row w-full max-w-4xl mx-auto">
      <h1 className="text-4xl text-white mb-6">Arcon GPT</h1>
      <h2 className="text-xl text-white mb-6">
        Platziere deine Abacus oder ICT Anfrage und lasse dir vom Arcon GPT
        helfen.
      </h2>
      <div className="flex-col w-full">
        <form onSubmit={handleSubmit} className="mb-12">
          <textarea
            className="w-full h-36 p-3 border-1 border-gray-300 hover:border-arcon-light-green focus:border-arcon-light-green rounded shadow-xl text-xl bg-white mb-4"
            value={input}
            placeholder="Hi, hier ist Arcon GPT, wie kann ich dir helfen?"
            onChange={handleInputChange}
          />
          <div className="space-x-4">
          <button
            type="submit"
            className="btn bg-arcon-light-green border-none text-slate-50 max-w-40 text-md "
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Los geht's!"
            )}
          </button>
          <button
            className="btn border-2 border-arcon-light-green bg-transparent text-slate-50 max-w-60 text-md h-2 absolute ml-4"
            type="button"
            onClick={newConversation}
          >
            Neues Thema
          </button>
          </div>
        </form>
      </div>
      {messages.map((message, index) => (
        <div
          key={index}
          className="whitespace-pre-wrap text-white text-xl bg-arcon-green"
        >
          <strong
            className={
              message.role === "Arcon GPT" ? "text-arcon-light-green" : ""
            }
          >
            {`${message.role}: `}
          </strong>
          {message.content}
          <br />
          <br />
        </div>
      ))}
    </div>
  );
};

export default ChatBot;
