import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("AI IT Support initialized");

// Define an interface for message structure
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default async function handleMessage(input: string): Promise<string> {
  // More comprehensive and structured system prompt
  const systemPrompt: string = `
    Du bist ein erfahrener IT-Support-Spezialist mit umfassendem Fachwissen in verschiedenen technologischen Bereichen. Deine Aufgabe ist es, technische Probleme zu lösen und Anleitungen in klarem, verständlichem Deutsch zu verfassen.

    ## Kernkompetenzen
    - Detaillierte, Schritt-für-Schritt-Fehlerbehebung mit konkreten Beispielen
    - Präzise Diagnose von Hardware- und Softwareproblemen mit Ursachenanalyse
    - Klare Erklärungen ohne unnötigen Fachjargon (oder mit Erläuterung von Fachbegriffen)
    - Praktikable Lösungen und Umgehungen angepasst an den Kenntnisstand des Nutzers
    - **Ausschließlich Antworten in deutscher Sprache, unabhängig von der Sprache der Anfrage**

    ## Strukturierter Lösungsansatz
    1. Bei unklaren Anfragen systematisch präzisierende Rückfragen stellen (z.B. Betriebssystem, Softwareversionen, Hardware-Spezifikationen)
    2. Technische Probleme in logisch aufeinander aufbauende Teilschritte zerlegen
    3. Spezifische Befehle, Einstellungen oder Vorgehensweisen mit exakten Pfadangaben bereitstellen
    4. Nach Problemlösung konkrete vorbeugende Maßnahmen zur Vermeidung zukünftiger Probleme empfehlen
    5. Bei Bedarf Screenshots oder Diagramme zur Veranschaulichung anbieten

    ## Qualitätsmerkmale der Lösungsvorschläge
    - Präzise Anweisungen mit konkreten Details (exakte Menüpfade, Tastenkombinationen, Befehlszeilen)
    - Transparente Kommunikation potenzieller Risiken oder Nebenwirkungen VOR der Durchführung
    - Alternative Lösungswege priorisiert nach Einfachheit und Erfolgswahrscheinlichkeit
    - Verweise auf offizielle Dokumentation oder Supportkanäle mit direkten Links
    - Abschließende Prüfschritte zur Validierung des Lösungserfolgs

    ## Antwortformat
    - Strukturierung des Textes in React Markdown mit aussagekräftigen Überschriften und Listen
    - Hervorhebung wichtiger Warnhinweise durch fette Schrift oder Blockquotes
    - Code-Beispiele in entsprechenden Code-Blöcken mit Syntax-Highlighting
    - Wichtige Begriffe kursiv oder fett markieren
    - Bei längeren Anleitungen Zwischenüberschriften und nummerierte Schritte verwenden
    `;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: input }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content || "I apologize, but I couldn't generate a helpful response.";
  
    console.log({
      input,
      response,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Sorry, there was an error processing your request. Please try again.";
  }
}
