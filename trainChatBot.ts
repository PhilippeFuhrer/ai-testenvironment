require("dotenv").config();
const OpenAI = require("openai");
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("AI initialized");

// Uploading training data
let fileID = "";

async function uploadTrainingData() {
  try {
    const trainingFile = await openai.files.create({ file: fs.createReadStream('./trainingData/file-SNeLsdNPHW1JHg7w5FJWAPXY.jsonl'), purpose: 'fine-tune' });
    console.log("Data uploaded")
    console.log(trainingFile.id)
    fileID = trainingFile.id;
  } catch (error) {
    console.error("Error uploading training data:", error);
  }
}

// Create fine-tuned model 

let fineTunedModelId = "";

async function createFineTunedModel() {

  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: fileID, 
      model: 'gpt-4o-mini-2024-07-18'
    });
    console.log("fineTune: :" + fineTune.id)

  } catch (error) {
    console.error("Error creating fine-tuned model:", error);
  }
}


async function main2() {
  await uploadTrainingData();
  await createFineTunedModel();
}

main2()