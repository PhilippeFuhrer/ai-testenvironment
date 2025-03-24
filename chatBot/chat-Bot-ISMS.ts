import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("ISMS Expert initialized (URL scanning only)");

// Define an interface for message structure
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Define a type for chat history
type ChatHistory = [string, string][]; // [user message, assistant response][]

// Main function to handle messages
export default async function handleMessage(input: string, existingHistory: ChatHistory = []): Promise<string> {
  console.log("ISMS Expert: Processing new request...");
  
  // System prompt with ISMS expertise focus
  const systemPrompt: string = `
    Du bist ein hochqualifizierter Informationssicherheits-Spezialist mit Expertise im Bereich ISMS (Informationssicherheits-Managementsystem). 
    Deine Aufgabe ist es, Fragen zum ISMS der ARCON Informatik AG präzise, kompetent und detailliert zu beantworten.
    
    Grundsätze für deine Antworten:
    - Verwende primär die Informationen, die du aus dem Confluence-ISMS der ARCON Informatik AG erhalten hast.
    - Stelle sicher, dass deine Antworten den aktuellen Richtlinien und Prozessen des ISMS der ARCON entsprechen.
    - Erkläre komplexe ISMS-Konzepte klar und verständlich, auch für Personen ohne tiefes IT-Sicherheitswissen.
    - Beziehe dich spezifisch auf ARCON-Prozesse, wenn diese in den bereitgestellten Informationen erwähnt werden.
    - Bei fehlenden Informationen weise darauf hin, dass du nur auf Basis der bereitgestellten Confluence-Inhalte antworten kannst und genauere Details im internen ISMS-System der ARCON zu finden sein könnten.
    - Achte darauf, keine sensiblen internen Informationen preiszugeben, falls die bereitgestellten Informationen solche enthalten sollten.
    
    Format deiner Antworten:
    - Antworte immer auf Deutsch.
    - Beginne mit einer prägnanten Zusammenfassung der Antwort.
    - Strukturiere längere Antworten übersichtlich mit Zwischenüberschriften.
    - Verwende bei Bedarf Aufzählungen für bessere Übersichtlichkeit.
    - Schließe komplexere Antworten mit einer kurzen Zusammenfassung ab.
    
    Quellenangabe:
    - Verweise auf die entsprechenden Abschnitte des ISMS-Dokuments, wenn möglich.
    - Wenn du keine ausreichenden Informationen zu einer Frage hast, kommuniziere das klar und präzise, ohne zu spekulieren.
  `;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add existing chat history to messages
  if (existingHistory.length > 0) {
    for (const [userMsg, assistantMsg] of existingHistory) {
      messages.push({ role: "user", content: userMsg });
      messages.push({ role: "assistant", content: assistantMsg });
    }
  }

  try {
    // Add the user's input
    messages.push({ role: "user", content: input });
    // Generate final response using only gpt-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.4, // Lower temperature for more factual accuracy
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content || 
      "Es tut mir leid, ich konnte keine Antwort zu diesem Thema finden.";

    console.log({
      input,
      historyLength: existingHistory.length,
      responseLength: response.length,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("Error in handleMessage:", error);
    return "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
  }
}