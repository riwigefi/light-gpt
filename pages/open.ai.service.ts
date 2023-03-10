import { parseOpenAIStream } from './utils';
import { IMessage } from './interface';

export const chatWithGptTurbo = async (
    apiKey: string,
    messages: IMessage[],
    controller: AbortController
) => {
    const requestInit: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        method: 'POST',
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.6,

            stream: true,
        }),
        signal: controller.signal,
    };

    try {
        const res = await fetch(
            `https://api.openai.com/v1/chat/completions`,
            requestInit
        ).then(async (response) => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }
            return response;
        });
        return new Response(parseOpenAIStream(res));
    } catch (error) {
        throw error;
    }
};
