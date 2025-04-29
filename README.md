This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`]

## Getting Started

Run the app (in development mode):
1. Install node.js
2. npm install
3. npm run dev

Making and running the build (production):
1. npm run build -> build app
2. npm run start -> start app

## OpenAI API Schnittstelle
Als Grundlegendes LLM Modell wird GPT-4.o verwendet. Guthaben für die API Abfragen müssen auf https://platform.openai.com/ (Login via Google Konto philippe.fuhrer@hotmail.com) aufgeladen werden.

## Datenbank
Als grundlegende Datenbank wird https://supabase.com/dashboard/project SupaBase verwendet. (Login via Github Konto von philippe.fuhrer@hotmail.com)

## Neue Daten für RAG hochladen

1. Sind die Daten für eine vorhandene oder neue Vektordatenbank? Falls für eine neue auf PineCone (Login auf https://login.pinecone.io/login? via Google Konto: philippe.fuhrer@arcon.ch) eine eröffnen.
    Embedding Modell: custom emedding: vector type: dense, dimensions: 1536,  metric: cosine, Embedding wird bereits über Langchain gemacht!

2. Daten bereinigen (Vgl. PythonScripts,) aufbereiten und als txt im Ordner data ablegen.

3. Im File "Upload-data-to-pineCone.ts" Pfad zur Datei einfügen, Metainformationen einfügen.

4. Falls neue Datenbank im .env File die neue Datenbank-Variabel definieren, diese dann auch im File "Upload-data-to-pineCone.ts" einpflegen.

5. Im directory, wo das File "Upload" abgelegt ist: npx tsx Upload-data-to-pineCone.ts -> Start upload
    ("C:\Programming\ai-generator-multi-purpose\pineConeDB>npx tsx Upload-data-to-pineCone.ts")

## Update auf Arcon Server (PW im PWS: ARCONKI01)

1. Dienst beenden auf Windows Dienste.

2. VS Code öffnen und einen Pull-Request machen, um den aktuellen Code zu fetchen.

3. CMD als Admin öffnen: 
    cd C:\Arcon Agent\ai-generator-multi-purpose
    npm install
    npm run build

4. Prüfen ob .env variablen verändert wurden, falls ja updaten. (Bspw. beim hinzufügen einer neuen Datenbank auf PineCone).

4. CMD als Admin öffnen: Registrieren und Starten des Dienstes via NSSM auf Windows Server auf 
    cd C:\Util\nssm\win64
    nssm remove arcon-agent confirm
    nssm install arcon-agent 
        Path: C:\Program Files\nodejs\node.exe
        Start directory: C:\Arcon Agent\ai-generator-multi-purpose
        Arguments: C:\Arcon Agent\ai-generator-multi-purpose\node_modules\next\dist\bin\next start -p 3000
    nssm start arcon-agent

5. Testing auf eigenem Laptop im VPN, nicht direkt hier auf Server! Dauert ca. 30 sec bis live.