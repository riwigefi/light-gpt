export enum ERole {
    system = 'system',
    assistant = 'assistant',
    user = 'user',
}

export interface IMessage {
    role: ERole;
    content: string;
}

export type Theme = 'light' | 'dark';

export enum SystemSettingMenu {
    userAvatarSettings = 'userAvatarSettings',
    robotAvatarSettings = 'robotAvatarSettings',
    systemRoleSettings = 'systemRoleSettings',
    apiKeySettings = 'apiKeySettings',
}
