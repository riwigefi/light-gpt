import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

import CryptoJS from 'crypto-js';

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const secretKey = generateSecretKey();
    const apiKey = process.env.API_KEY || '';
    res.status(200).json({
        secretKey,
        apiKey: CryptoJS.AES.encrypt(apiKey, secretKey).toString(),
    });
}
