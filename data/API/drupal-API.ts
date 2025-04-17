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
      `https://arcon.drupal-wiki.net/node/1196?_format=json&api-key=${token}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      }
    );
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching data:", error.response?.data || error.message);
      console.error("Status:", error.response?.status);
    } else {
      console.error("Error fetching data:", error);
    }
    throw error;
  }
}
