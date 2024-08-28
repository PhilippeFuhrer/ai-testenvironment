const OpenAI = require("openai");
require('dotenv').config();

async function main() {

  const openai = new OpenAI({ apiKey: process.env.openAI_API_KEY });

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}


main();