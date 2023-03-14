import { NextApiRequest, NextApiResponse } from 'next';

import { IMessage } from '../../interface';

import fetch from 'node-fetch';

interface PostData {
    messages: Omit<IMessage, 'id'>;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const apiKey = process.env.API_KEY;
    // owner api key proxy open ai service
    if (req.method === 'POST') {
        const postData = JSON.parse(req.body) as PostData;

        const options = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            method: 'POST',
            timeout: 8000,
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: postData.messages,
                temperature: 0.6,
                stream: true,
            }),
        };

        try {
            const proxyRes = await fetch(
                `https://api.openai.com/v1/chat/completions`,
                options
            );
            if (!proxyRes.body) {
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }

            // if (proxyRes.headers.get('transfer-encoding') === 'chunked') {
            //     res.setHeader('Transfer-Encoding', 'chunked');
            //     const proxyResContentType =
            //         proxyRes.headers.get('content-type') ||
            //         'application/octet-stream';
            //     res.setHeader('Content-Type', proxyResContentType);
            //     proxyRes.body?.pipe(res);
            // } else {
            //     const body = await proxyRes.arrayBuffer();
            //     res.status(proxyRes.status).send(body);
            // }
            proxyRes.body.on('data', (chunk) => {
                // Real-time writing data into the response stream and sending it to the client.
                res.write(chunk);
            });

            proxyRes.body.on('end', () => {
                // Send an end signal to the client when the response stream ends.
                res.end();
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(405).end();
    }
}
