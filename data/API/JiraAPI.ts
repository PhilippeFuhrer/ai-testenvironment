import { config } from "dotenv";
import axios from "axios";
import path from "path";
import fs from "fs";

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
          fields: "key,summary, description, status, assignee, updated",
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

    // Transformiere die Assignee-Daten, sodass nur der Name übrig bleibt
    allTickets = allTickets.map(({ expand, id, self, ...ticket }) => ({
      ...ticket,
      URL: `${BASE_URL}/browse/${ticket.key}`,
      fields: {
        ...ticket.fields,
        assignee: ticket.fields.assignee ? ticket.fields.assignee.name : null,
        status: ticket.fields.status ? ticket.fields.status.name : null,
      },
    }));

    console.log(
      `Total tickets found in ${projectKey} project: ${allTickets.length}`
    );
    console.log("example ticket:", allTickets[0]);

    return allTickets;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
};

// Save tickets to a .txt file in the specified directory
const saveTicketsToFile = (tickets: Array<any>, filename: string) => {
  try {
    // Create the directory if it doesn't exist
    const dirPath = path.join(__dirname, '../Data-for-RAG');

    const fileContent = tickets
      .map(ticket =>
        `Key: ${ticket.key}\n URL: ${ticket.URL}\n Summary: ${ticket.fields.summary}\nDescription: ${ticket.fields.description}\nUpdated: ${ticket.fields.updated}\nAssignee: ${ticket.fields.assignee}\nStatus: ${ticket.fields.status}`
      )
      .join("\n\n/article----------/\n\n");

    const filePath = path.join(dirPath, filename); // Full path to the file in /data/Data-for-RAG
    fs.writeFileSync(filePath, fileContent, "utf8");
    console.log(`Tickets saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving tickets to file:", error);
  }
};

// Fetch tickets and save them
fetchAllTickets("ISMS").then(tickets => {
  if (tickets.length > 0) {
    saveTicketsToFile(tickets, "JIRA-tickets.txt");
  } else {
    console.log("No tickets found.");
  }
});
