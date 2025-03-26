import axios from "axios";
import { config } from "dotenv";
import path from "path";

// Lädt die Umgebungsvariablen aus .env
const result = config({ path: path.resolve(__dirname, "../../.env") });

if (result.error) {
    throw new Error(`Fehler beim Laden der .env-Datei: ${result.error.message}`);
}

// Umgebungsvariablen abrufen
const BASE_URL = process.env.CONFLUENCE_BASE_URL;
const API_TOKEN = process.env.CONFLUENCE_API_TOKEN; // Kein Benutzername mehr nötig!

// Funktion, um alle Seiten eines Spaces abzurufen
const fetchConfluencePages = async (spaceKey: string) => {
    if (!BASE_URL || !API_TOKEN) {
        throw new Error("Fehlende Umgebungsvariablen! Stelle sicher, dass .env korrekt geladen wird.");
    }

    try {
        const response = await axios.get(`${BASE_URL}/rest/api/content?spaceKey=${spaceKey}`, {
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`, // Hier wird das Token als Bearer verwendet
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
