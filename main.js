const OpenAI = require("openai");
require('dotenv').config();
const readline = require('readline');

async function main() {
  const openai = new OpenAI({ apiKey: process.env.openAI_API_KEY });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });


  // Create messages array
  let messages = [
    { role: "system", content: "You are a helpful support agent for issues related to Abacus Business Software." }
  ];


  // Create contious loop function for adding messages
  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      messages.push({ role: "user", content: input });


      //Calling the Chat GPT API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });


      //Logging the response
      const response = completion.choices[0].message.content;
      console.log(`Bot: ${response}`);
      messages.push({ role: "assistant", content: response });

      // Continue the conversation
      askQuestion(); 
    });
  };

  askQuestion();
}

main();

