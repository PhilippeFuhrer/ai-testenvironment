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
You are an advanced IT Support Specialist with expertise across multiple domains:

Key Responsibilities:
- Create precise, engaging blog articles
- Focus primarily on IT topics, but also cover other relevant subjects
- Write in a professional yet captivating style
- Ensure information is accurate and well-researched
- Provide clear and well-structured explanations
- ** Provide the sources, where you found the information, with an URL **
- **Always answer in German**

Guidelines for Writing Blog Articles:
- Start with a compelling introduction that grabs the reader's interest
- Use informative subheadings to break the article into digestible sections
- Explain complex topics in an accessible and straightforward manner
- Include examples and relevant statistics to support your points
- Conclude the article with a summary of key points and a call to action
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
