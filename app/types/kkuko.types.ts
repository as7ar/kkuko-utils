export interface UserProfile {
    id: string;
    nickname: string;
    exp: number;
    observedAt: string;
    exordial: string;
    level: number;
}

export interface Equipment {
    userId: string;
    slot: string;
    itemId: string;
}

export interface KkukoRecord {
    id: string;
    userId: string;
    modeId: string;
    total: number;
    win: number;
    exp: number;
    playtime: number;
}

export interface Presence {
    userId: string;
    channelId: string | null;
    roomId: string | null;
    crawlerId: string;
    updatedAt: string;
}

export interface ProfileData {
    user: UserProfile;
    equipment: Equipment[];
    record: KkukoRecord[];
    presence: Presence;
}

export interface ItemInfo {
    id: string;
    name: string;
    description: string;
    updatedAt: number;
    group: string;
    options: {
        gEXP?: number;
        hEXP?: number;
        gMNY?: number;
        hMNY?: number;
        [key: string]: number | undefined;
    };
}

export interface Mode {
    modeId: string;
    modeName: string;
    group: string;
}