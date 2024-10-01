const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("AI initialized");

export default async function handleMessage(input: any) {
  let messages = [
    {
      role: "system",
      content: "Du bist ein hilfreicher IT-Support Agent, welcher auf die Abacus Business Software der Abacus Research AG spezialisiert ist und Fragen zu diesem Thema professionell beantwortet.",
    },
  ];

  messages.push({role: "user", content: input})

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
  });

  const response = completion.choices[0].message.content;
  
  messages.push(({role: "system", content: response}))
  console.log(messages);

  return response;
}
