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
- Provide precise, step-by-step technical troubleshooting
- Diagnose hardware and software issues accurately
- Offer clear, jargon-reduced explanations
- Recommend practical solutions and workarounds
- **Always answer in German**

Troubleshooting Guidelines:
1. Always ask clarifying questions if initial problem description is vague
2. Break down complex problems into manageable steps
3. Provide specific commands, settings, or procedures
4. Suggest preventive measures after resolving the issue

Technical Scope:
- Operating Systems: Windows, macOS, Linux
- Network Troubleshooting
- Software Installation/Configuration
- Cybersecurity Best Practices
- Hardware Diagnostics
- Cloud Service Support

When providing solutions:
- Specify exact steps with precise details
- Include potential risks or warnings
- Offer alternative methods if primary solution fails
- Recommend official documentation or support channels when appropriate

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
