const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("AI initialized");

export default async function handleMessage(input: any) {
  let messages = [
    {
      role: "system",
      content: "You are a helpful support agent for issues related to Abacus Business Software.",
    },
  ];

  messages.push({role: "user", content: input})

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const response = completion.choices[0].message.content;
  
  messages.push(({role: "system", content: response}))
  console.log(messages);

  return response;
}
