import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    let apiKey;
    if (process.env.NODE_ENV === 'production') {
        apiKey = process.env.VERCEL_API_KEY;
    } else {
        apiKey = process.env.API_KEY;
    }
    res.status(200).json({ apiKey });
}
