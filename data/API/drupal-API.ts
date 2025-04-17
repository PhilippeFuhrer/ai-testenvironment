import axios from "axios";
import { config } from "dotenv";
import path from "path";

// API documentation https://arcon.drupal-wiki.net/api/operations/getPages

// Load environment variables from .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

const token = process.env.DRUPAL_API_TOKEN;

// Get all page IDs with pagination
async function getPageIds() {
  const allPageIds = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    try {
      console.log(`Fetching page IDs from page ${currentPage}...`);
      const response = await axios.get(
        `https://arcon.drupal-wiki.net/api/rest/scope/api/page?page=${currentPage}`,
        {
          headers: {
            "Authorization": token,
            "Accept": "application/json"
          }
        }
      );
      
      // Extract page IDs from current page
      const pageIds = response.data.content.map((page: { id: any; }) => page.id);
      allPageIds.push(...pageIds);
      
      console.log(`Retrieved ${pageIds.length} page IDs from page ${currentPage}`);
      
      // Check if there are more pages
      if (!response.data.content || response.data.content.length === 0) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    } catch (error) {
      console.error(`Error fetching page IDs from page ${currentPage}:`, error);
      hasMorePages = false;
    }
  }
  
  return allPageIds;
}

// Get full content for a specific page by ID
async function getPageContent(pageId: any) {
  try {
    const response = await axios.get(
      `https://arcon.drupal-wiki.net/api/rest/scope/api/page/${pageId}`,
      {
        headers: {
          "Authorization": token,
          "Accept": "application/json"
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching content for page ID ${pageId}:`, error);
    return null;
  }
}

// Main function
async function fetchAllPagesContent() {
  // Get all page IDs
  const pageIds = await getPageIds();
  console.log(`Found ${pageIds.length} pages`);
  
  // Get content for each page
  const allPages = [];
  
  for (const pageId of pageIds) {
    const content = await getPageContent(pageId);
    if (content) {
      allPages.push(content);
      console.log(`Fetched content for page ID ${pageId}`);
    }
  }
  
  console.log(`Successfully fetched ${allPages.length} pages with full content`);
  console.log(allPages);
  return allPages;
}

// Run the script
fetchAllPagesContent();