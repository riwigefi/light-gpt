import { NextApiRequest, NextApiResponse } from 'next';
import { availableKeys } from '../../available-key.config';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const randomIndex = Math.floor(Math.random() * availableKeys.length);
    const apiKey = availableKeys[randomIndex];
    console.log('得到的key--', apiKey);
    res.status(200).json({ apiKey });
}
