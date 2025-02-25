This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`] via VITE

## Getting Started

Run the app:
1. Install node.js
2. npm install
3. npm run dev

Making and running the build:
1. npm run build -> build app
2. npm run start -> start app

## Upload data 
npx tsx Upload-data-to-pineCone.ts

## Update auf Arcon Server (PW im PWS: ARCONKI01)
1. npm install (alle neuen Libraries installieren)

2. Dienst beenden auf Windows Dienste

3. CMD als Admin öffnen und im root folgendes eigeben: C:\Arcon Agent\ai-generator-multi-purpose>
    npx pkg index.js -o arcon-agent.exe -t node16-win-x64
    (Buildfile: index.js)

4. Registrieren und Starten des Dienstes via NSSM auf Windows Server auf C:\Util\nssm\win64>
    nssm remove arcon-agent confirm
    nssm install arcon-agent (Path -> exe file, directory -> root directory of app)
    nssm start arcon-agent

5. Testing auf eigenem Laptop im VPN, nicht direkt hier auf Server!

