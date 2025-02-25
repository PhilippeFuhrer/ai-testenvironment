This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`] via VITE

## Getting Started

Run the app (in development mode):
1. Install node.js
2. npm install
3. npm run dev

Making and running the build (production):
1. npm run build -> build app
2. npm run start -> start app

## Neue Daten für RAG hochladen
1. Sind die Daten für eine vorhandene oder neue Vektordatenbank? Falls für eine neue auf PineCone (Login via Google Konto: philippe.fuhrer@arcon.ch) eine eröffnen.
2. Daten als txt im Ordner data ablegen.
3. Im File "Upload-data-to-pineCone.ts" Pfad zur Datei einfügen, Metainformationen einfügen und Datenbank (bspw. ess-agent) auswählen.
4. Falls neue Datenbank im .env File die neue Datenbank-Variabel definieren.
4. Im root directory: npx tsx Upload-data-to-pineCone.ts -> Start upload

## Update auf Arcon Server (PW im PWS: ARCONKI01)
1. CMD im root (C:\Arcon Agent\ai-generator-multi-purpose>): 
    npm install (alle neuen Libraries installieren)

2. Prüfen ob .env variablen verändert wurden, falls ja updaten.

3. Dienst beenden auf Windows Dienste.

4. CMD als Admin öffnen: Im root folgendes eigeben: C:\Arcon Agent\ai-generator-multi-purpose>
    npx pkg index.js -o arcon-agent.exe -t node16-win-x64
    (Buildfile: index.js)

5. CMD als Admin öffnen: Registrieren und Starten des Dienstes via NSSM auf Windows Server auf C:\Util\nssm\win64>
    nssm remove arcon-agent confirm
    nssm install arcon-agent (Path -> exe file, directory -> root directory of app)
    nssm start arcon-agent

6. Testing auf eigenem Laptop im VPN, nicht direkt hier auf Server!

