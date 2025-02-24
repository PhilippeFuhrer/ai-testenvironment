This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`] via VITE

## Getting Started

Run the app:
1. Install node.js
2. npm install
3. npm run dev

Making and running the build:
1. npm run build -> build app
2. npm run start -> start app

## cmd command for building the .exe file (binary file) for execution on windows server with pkg package: ---> als Admin ausführen
Buildfile: index.js
npx pkg index.js -o arcon-agent.exe -t node16-win-x64

## Registrieren und Starten des Dienstes via NSSM auf Windows Server
nssm install arcon-agent
nssm start arcon-agent

## Upload data 
npx tsx Upload-data-to-pineCone.ts

