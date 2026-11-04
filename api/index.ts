import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { app } = await import('../server.js');
    app(req, res);
  } catch (error) {
    console.error('Vercel Express API startup failed:', error);
    let detail = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown startup error';
    for (const secret of [
      process.env.ADMIN_BOOTSTRAP_PASSWORD,
      process.env.ADMIN_SESSION_SECRET,
      process.env.RSVP_SHEET_READ_KEY,
    ]) {
      if (secret) detail = detail.replaceAll(secret, '[redacted]');
    }
    res.status(500).json({
      error: 'The API could not start.',
      detail,
    });
  }
}
