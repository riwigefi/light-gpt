import {
    createParser,
    ParseEvent,
    ReconnectInterval,
} from 'eventsource-parser';

import CryptoJS from 'crypto-js';

export const SECRET_KEY =
    '64787423c7ea99e608bab61303b309a996a1e000db87bd73533bd979892b1644';

export const encryptApiKey = (apiKey: string) => {
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, SECRET_KEY).toString();
    return encryptedApiKey;
};

export const decryptApiKey = (encryptedApiKey: string) => {
    // 使用AES加密算法进行解密
    const bytes = CryptoJS.AES.decrypt(encryptedApiKey, SECRET_KEY);
    const decryptedApiKey = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedApiKey;
};

export const parseOpenAIStream = (rawResponse: Response) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
        async start(controller) {
            const streamParser = (event: ParseEvent | ReconnectInterval) => {
                if (event.type === 'event') {
                    const data = event.data;
                    if (data === '[DONE]') {
                        controller.close();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const text = json.choices?.[0]?.delta?.content || '';
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                    } catch (e) {}
                }
            };
            const parser = createParser(streamParser);
            if (!rawResponse.body) return;
            const reader = rawResponse.body.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    parser.feed(decoder.decode(value));
                }
            } catch (error) {}
        },
    });
    return stream;
};

export function dataURItoBlob(dataURI: string) {
    // 将base64编码的数据去掉头部信息
    const byteString = atob(dataURI.split(',')[1]);
    // 创建一个类型数组对象来存放转换后的字符
    const ia = new Uint8Array(byteString.length);
    // 循环遍历每个字符，将它们转换成Unicode字符码，并存储到数组中
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    // 使用Blob对象封装二进制数据，并设置MIME类型为图片格式
    const blob = new Blob([ia], { type: 'image/png' });
    return blob;
}

export const readBlobAsDataURL = (blob: Blob): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString() || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const formatTimestamp = (timestamp: number) => {
    const length = timestamp.toString().length;
    if (length === 10) {
        timestamp *= 1000; // 转换为毫秒
    }
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const formattedDate =
        year +
        '/' +
        (month > 9 ? month : `0${month}`) +
        '/' +
        (day > 9 ? day : `0${day}`);
    return formattedDate;
};

export const ThemeLocalKey = 'light_gpt_theme';
export const UserAvatarLocalKey = 'light_gpt_user_avatar';
export const RobotAvatarLocalKey = 'light_gpt_robot_avatar';
export const SystemRoleLocalKey = 'light_gpt_system_role';
export const APIKeyLocalKey = 'light_gpt_api_key';

export const GenerateImagePromptPrefix = 'img-';
