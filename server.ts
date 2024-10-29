import express, { Request, Response } from 'express';
import next from 'next';
import getConfig from 'next/config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { serverRuntimeConfig } = getConfig();
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Default Next.js handling
  server.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  const vpnServerIP = serverRuntimeConfig.vpnServerIP || '0.0.0.0';

  server.listen(3000, vpnServerIP, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${vpnServerIP}:3000`);
  });
});