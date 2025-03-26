import axios from "axios";
import { config } from "dotenv";
import path from "path";
import { text } from "stream/consumers";
import * as fs from "fs";

// Load environment variables from .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

// Environment variables
const BASE_URL = process.env.CONFLUENCE_BASE_URL;
const API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

if (!BASE_URL || !API_TOKEN) {
  throw new Error(
    "Missing environment variables! Make sure .env is correctly loaded."
  );
}

// Function to clean HTML content
const cleanHtml = (html: string): string => {
  // Remove all HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Handle line breaks and spacing
  return decoded
    .replace(/\n\s*\n/g, "\n\n") // Replace multiple newlines with just two
    .trim(); // Remove extra whitespace at the beginning and end
};

// Fetch all pages from a Confluence space with pagination
const fetchAllPageIDs = async (spaceKey: string) => {
  try {
    let allPages: Array<{ id: string; title: string }> = [];
    let start = 0;
    const limit = 25; // Number of results per request
    let hasMoreResults = true;

    while (hasMoreResults) {
      const response = await axios.get(`${BASE_URL}/rest/api/content`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          spaceKey: spaceKey,
          limit: limit,
          start: start,
          expand: "title",
        },
      });

      const results = response.data.results;
      allPages = allPages.concat(
        results.map((page: any) => ({
          id: page.id,
          title: page.title,
        }))
      );

      // Check if there are more pages to fetch
      if (results.length < limit) {
        hasMoreResults = false;
      } else {
        start += limit;
      }

      console.log(`Fetched ${allPages.length} pages so far...`);
    }

    console.log(`Total pages found in ${spaceKey} space: ${allPages.length}`);
    return allPages;
  } catch (error) {
    console.error("Error fetching page IDs:", error);
    return [];
  }
};

// Fetch full content of a page
const fetchPageContent = async (pageId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/rest/api/content/${pageId}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      params: {
        expand: "body.storage,_links", // Fetch the full HTML content and links
      },
    });

    // Get the page URL
    const webUrl = response.data._links.webui;
    // For Confluence Server, we need to prepend the BASE_URL if the link is relative
    const fullUrl = webUrl.startsWith("http") ? webUrl : `${BASE_URL}${webUrl}`;

    return {
      title: response.data.title,
      content: cleanHtml(response.data.body.storage.value), // Clean the HTML content
      url: fullUrl,
    };
  } catch (error) {
    console.error(`Error fetching content for page ID ${pageId}:`, error);
    return null;
  }
};

// Fetch content from all pages in "ISMS" space
const fetchContentFromISMS = async () => {
  console.log("Fetching all pages from ISMS space...");
  const pages = await fetchAllPageIDs("ISMS");

  if (pages.length === 0) {
    console.log("No pages found in ISMS space.");
    return;
  }

  console.log(`Found ${pages.length} pages. Fetching content for each page...`);

  // Create a data structure to store all content
  const allContent = [];

  for (const page of pages) {
    console.log(`Processing page: ${page.title} (ID: ${page.id})`);
    const content = await fetchPageContent(page.id);
    if (content) {
      console.log(`\n📄 Page: ${content.title}\n`);
      console.log(`URL: ${content.url}`);

      // Store content in the array
      if (content.content.length > 100 && content.title != "Uebersicht Teilnahme ISO 27001 Schulungen") {
        allContent.push({
          id: page.id,
          title: content.title,
          content: content.content,
          url: content.url,
        });
      }
    }
  }

  console.log(
    `Successfully processed ${allContent.length} pages from ISMS space.`
  );

  // Save all content to a text file
  const outputPath = path.resolve(
    __dirname,
    "../../data/Data-for-RAG/isms_content.txt"
  );

  // Create a formatted text content from all pages
  let textContent = "";
  for (const page of allContent) {
    textContent += "/article----------/\n\n";
    textContent += `Title: ${page.title}\n`;
    textContent += `URL: ${page.url}\n`;
    textContent += `Content: ${page.content}\n\n`;
  }

  fs.writeFileSync(outputPath, textContent, "utf8");
  console.log(`Content saved to: ${outputPath}`);

  return allContent;
};

// Run function
fetchContentFromISMS();
