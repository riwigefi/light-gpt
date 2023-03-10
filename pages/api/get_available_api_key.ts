import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const apiKey = process.env.API_KEY;
    console.log('得到的key--', apiKey);
    res.status(200).json({ apiKey });
}
