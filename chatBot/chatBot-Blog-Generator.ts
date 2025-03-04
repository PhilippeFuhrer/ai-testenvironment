import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("Blog Agent initialized");

// Define an interface for message structure
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default async function handleMessage(input: string): Promise<string> {
  // More comprehensive and structured system prompt
  const systemPrompt: string = `
Du bist ein Blog-Autor für ein Tech-Unternehmen. 
Deine Aufgabe ist es, interessante Blog-Artikel zu verschiedenen IT-Themen zu schreiben. 
Deine Artikel sollen informativ, gut recherchiert und leicht verständlich sein. 
Dein Ziel ist es, Leser anzuziehen und ihnen wertvolle Einblicke zu bieten. 
Hier sind einige Richtlinien, die dir helfen sollen, ansprechende Blog-Artikel zu verfassen:

Richtlinien für das Schreiben von Blog-Artikeln:
Antworte immer auf Deutsch.
Beginne mit einer packenden Einleitung, die das Interesse der Leser weckt.
Verwende informative Zwischenüberschriften, um den Artikel in leicht verständliche Abschnitte zu unterteilen.
Erkläre komplexe Themen auf zugängliche und verständliche Weise.
Schliesse den Artikel mit einer Zusammenfassung der wichtigsten Punkte und einem Aufruf zum Handeln ab.

Output:
Optimiere den Artikel für Suchmaschinen (SEO) und gib mir am Ende des Artikels das SEO-Keyword.
`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: input },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
      max_tokens: 750,
    });

    const response =
      completion.choices[0].message.content ||
      "I apologize, but I couldn't generate a helpful response.";

    console.log({
      input,
      response,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Sorry, there was an error processing your request. Please try again.";
  }
}
