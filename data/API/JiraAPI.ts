import { config } from "dotenv";
import axios from "axios";
import path from "path";

// Load environment variables from .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
  throw new Error(`Error loading .env file: ${result.error.message}`);
}

// Environment variables
const BASE_URL = process.env.JIRA_BASE_URL;
const API_TOKEN = process.env.JIRA_API_TOKEN;

if (!BASE_URL || !API_TOKEN) {
  throw new Error(
    "Missing environment variables! Make sure .env is correctly loaded."
  );
}

console.log("environment variables loaded");

// Fetch all tickets from Jira with pagination
const fetchAllTickets = async (projectKey: string) => {
  try {
    let allTickets: Array<any> = [];
    let startAt = 0;
    const maxResults = 100;
    let hasMoreResults = true;

    console.log(`Fetching tickets from ${projectKey} project...`);

    while (hasMoreResults) {
      const response = await axios.get(`${BASE_URL}/rest/api/2/search`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          jql: `project = ${projectKey}`,
          startAt: startAt,
          maxResults: maxResults,
          fields: "key,summary,status,assignee,created,updated",
        },
      });

      const tickets = response.data.issues;
      allTickets = allTickets.concat(tickets);

      console.log(`Fetched ${allTickets.length} tickets so far...`);

      // Check if there are more tickets to fetch
      if (tickets.length < maxResults) {
        hasMoreResults = false;
      } else {
        startAt += maxResults;
      }
    }

    console.log(`Total tickets found in ${projectKey} project: ${allTickets.length}`);
    return allTickets;

  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
};


fetchAllTickets("ISMS");
