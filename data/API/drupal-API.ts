import axios from "axios";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

const token = process.env.DRUPAL_API_TOKEN;

async function getAllPages(startPage: number, endPage: number) {
  const allData = []; // Array to store data from all pages

  for (let page = startPage; page <= endPage; page++) {
    try {
      const response = await axios.get(
        `https://arcon.drupal-wiki.net/api/rest/scope/api/page?page=${page}`, // Add page parameter
        {
          headers: {
            "Authorization": token,
            "Accept": "application/json, application/vnd.dw+json, application/vnd.dw.v1+json", // Explicitly request JSON
          },
        }
      );
      console.log(`Data fetched successfully for page ${page}`);

      // Add the full content of the page to the array
      allData.push({
        page,
        content: response.data.content, // Include the full content array
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching data for page ${page}:`, error.response?.data || error.message);
      } else {
        console.error(`Error fetching data for page ${page}:`, error);
      }
    }
  }

  return allData; // Return the aggregated data with full content
}

// Fetch data for all pages (1 to 700)
getAllPages(1, 700)
  .then((allData) => {
    console.log("All pages fetched successfully.");
    console.log(allData[1]); // Log the full content of all pages
  })
  .catch((error) => {
    console.error("Error fetching all pages:", error);
  });
