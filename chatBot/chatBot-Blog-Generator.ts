import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("Blog Agent with Enhanced Search and Multiple Sources initialized");

// Define an interface for message structure
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Define a type for chat history
type ChatHistory = [string, string][]; // [user message, assistant response][]

export default async function handleMessage(input: string, existingHistory: ChatHistory = []): Promise<string> {
  // System prompt explicitly requesting multiple sources
  const systemPrompt: string = `
    Du bist ein Blog-Autor für ein Tech-Unternehmen. 
    Deine Aufgabe ist es, interessante Blog-Artikel zu verschiedenen IT-Themen zu schreiben. 
    Deine Artikel sollen informativ, gut recherchiert und leicht verständlich sein. 
    Dein Ziel ist es, Leser anzuziehen und ihnen wertvolle Einblicke zu bieten. 

    Richtlinien für das Schreiben von Blog-Artikeln:
    - Antworte immer auf Deutsch.
    - Beginne mit einer packenden Einleitung, die das Interesse der Leser weckt.
    - Verwende informative Zwischenüberschriften, um den Artikel in leicht verständliche Abschnitte zu unterteilen.
    - Erkläre komplexe Themen auf zugängliche und verständliche Weise.
    - Schliesse den Artikel mit einer Zusammenfassung der wichtigsten Punkte und einem Aufruf zum Handeln ab.

    Anforderungen an die Quellen:
    - Verwende mindestens 3-5 verschiedene und aktuelle Quellen für deinen Artikel.
    - Gib alle verwendeten Quellen im Format "Titel der Quelle - URL" am Ende des Artikels an.
    - Achte auf seriöse und vertrauenswürdige Quellen wie Fachmagazine, wissenschaftliche Publikationen oder offizielle Webseiten.

    Output:
    - Optimiere den Artikel für Suchmaschinen (SEO) und gib am Ende des Artikels das SEO-Keyword an.
    - Füge nach dem SEO-Keyword eine Liste aller verwendeten Quellen unter der Überschrift "Quellen:" hinzu.
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

  console.log("History:")
  for (const history of existingHistory) {
    console.log(history);
  }

  // Add the current user input
  messages.push({ role: "user", content: input });

  try {
    // Erster Suchvorgang: Breite Recherche zum Thema
    const initialSearchCompletion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      web_search_options: {
        search_context_size: "high", // Maximale Suchergebnisse
      },
      messages: [
        { role: "user", content: `Finde verschiedene aktuelle und seriöse Quellen zum Thema: ${input}. Suche nach mindestens 5 verschiedenen Quellen, die unterschiedliche Aspekte des Themas abdecken.` }
      ],
    });

    const searchResults = initialSearchCompletion.choices[0].message.content || "";
    
    // Extrahiere potenzielle Quellen aus der ersten Suche
    messages.push({ 
      role: "assistant", 
      content: "Ich habe folgende Quellen und Informationen recherchiert: " + searchResults 
    });
    
    // Anfrage nach tieferer Recherche zu spezifischen Aspekten
    messages.push({ 
      role: "user", 
      content: "Basierend auf diesen Quellen, schreibe einen ausführlichen Blog-Artikel gemäß den Richtlinien. Verwende MINDESTENS 3-5 verschiedene Quellen und liste alle am Ende unter 'Quellen:' auf. Wichtig: Gib für jede Quelle sowohl den Titel als auch die vollständige URL an." 
    });

    // Finalen Blog generieren
    const blogCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1200, // Erhöht für mehr Platz für Quellen
    });

    const response = blogCompletion.choices[0].message.content || 
      "Es tut mir leid, ich konnte keinen Blog-Artikel erstellen.";

    console.log({
      input,
      historyLength: existingHistory.length,
      searchResultsLength: searchResults.length,
      responseLength: response.length,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
  }
}