import { parseOpenAIStream } from './utils';
import { ERole, IMessage } from './interface';

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
            messages: messages.map((item) => ({
                role: item.role,
                content: item.content,
            })),
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
                console.log('错误--', text, typeof text);
                throw JSON.parse(text);
            }
            return response;
        });
        return new Response(parseOpenAIStream(res));
    } catch (error) {
        throw error;
    }
};

export const chatWithGptTurboByProxy = async (
    messages: IMessage[],
    controller: AbortController
) => {
    try {
        const res = await fetch(`/api/chat_with_gpt_by_proxy`, {
            method: 'POST',
            body: JSON.stringify({
                messages: messages.map((item) => ({
                    role: item.role,
                    content: item.content,
                })),
            }),
            signal: controller.signal,
        }).then(async (response) => {
            if (!response.ok) {
                const text = await response.text();
                console.log('错误--', text, typeof text);
                throw JSON.parse(text);
            }
            return response;
        });
        return new Response(parseOpenAIStream(res));
    } catch (error) {
        throw error;
    }
};
