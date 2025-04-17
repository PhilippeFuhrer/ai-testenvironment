import axios from "axios";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

const token = process.env.DRUPAL_API_TOKEN; 

async function getData() {
  try {
    const response = await axios.get(
      `https://arcon.drupal-wiki.net/api/rest/scope/api/page`,
      {
        headers: {
          "Authorization": token,
          "Accept": "application/json, application/vnd.dw+json, application/vnd.dw.v1+json", // Explicitly request JSON
        },
      }
    );
    console.log("Respons Status:", JSON.stringify(response.data));
    return response.data; // Return the fetched data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching data:", error.response?.data || error.message);
    } else {
      console.error("Error fetching data:", error);
    }
    throw error; // Re-throw the error for further handling
  }
}
getData()
  .then((data) => {
    console.log("Data fetched successfully:", data);
  })
  .catch((error) => {
  });
