import axios from "axios";
import { config } from "dotenv";
import path from "path";

// Lädt die Umgebungsvariablen aus .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

// Überprüfen, ob das Laden der .env-Datei erfolgreich war
if (result.error) {
    throw new Error(`Fehler beim Laden der .env-Datei: ${result.error.message}`);
}

// Umgebungsvariablen abrufen
const BASE_URL = process.env.CONFLUENCE_BASE_URL;
const USERNAME = process.env.CONFLUENCE_USERNAME;
const API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

// Funktion, um alle Seiten eines Spaces abzurufen
const fetchConfluencePages = async (spaceKey: string) => {
    if (!BASE_URL || !USERNAME || !API_TOKEN) {
        throw new Error("Fehlende Umgebungsvariablen! Stelle sicher, dass .env korrekt geladen wird.");
    }

    // Basic Auth erstellen
    const auth = Buffer.from(`${USERNAME}:${API_TOKEN}`).toString("base64");

    try {
        const response = await axios.get(`${BASE_URL}/rest/api/content?spaceKey=${spaceKey}`, {
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Erfolgreiche API-Antwort:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
    }
};

// Beispielaufruf
fetchConfluencePages("ISMS");
