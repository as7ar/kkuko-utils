import type { Mode, RankingEntry } from '@/app/types/kkuko.types';

const API_BASE_URL = 'https://api.solidloop-studio.xyz/api/v1';

export async function fetchModes(): Promise<Mode[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/mode`, {
            cache: 'force-cache',
            next: { revalidate: 3600 } // 1 hour cache
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch modes: ${response.status}`);
        }

        const data = await response.json();
        return data.data as Mode[];
    } catch (error) {
        console.error('Error fetching modes:', error);
        return [];
    }
}

export async function fetchRanking(
    mode: string, 
    page: number = 1, 
    option: 'win' | 'exp' = 'win'
): Promise<RankingEntry[]> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            option
        });

        const response = await fetch(`${API_BASE_URL}/ranking/${mode}?${params}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ranking: ${response.status}`);
        }

        const data = await response.json();
        return data.data as RankingEntry[];
    } catch (error) {
        console.error('Error fetching ranking:', error);
        return [];
    }
}
