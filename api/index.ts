import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { app } = await import('../server.js');
    app(req, res);
  } catch (error) {
    console.error('Vercel Express API startup failed:', error);
    res.status(500).json({
      error: 'The API could not start. Open the Vercel deployment Runtime Logs and find "Vercel Express API startup failed" for the cause.',
    });
  }
}
