import { useState, useEffect, useCallback } from 'react';
import { rankingCache } from '../lib/cache';
import { fetchModes as fetchModesApi, fetchRanking as fetchRankingApi } from '../../shared/lib/api';
import type { RankingEntry, RankingOption, Mode } from '@/app/types/kkuko.types';

export const useKkukoRanking = () => {
    const [modes, setModes] = useState<Mode[]>([]);
    const [selectedMode, setSelectedMode] = useState<string>('');
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [option, setOption] = useState<RankingOption>('win');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modesLoading, setModesLoading] = useState(true);

    const fetchModes = useCallback(async () => {
        setModesLoading(true);
        try {
            const response = await fetchModesApi();
            const modesData = response.data.data as Mode[];
            setModes(modesData);
            if (modesData.length > 0) {
                setSelectedMode(modesData[0].modeId);
            }
        } catch (error) {
            console.error('Error fetching modes:', error);
            setModes([]);
        } finally {
            setModesLoading(false);
        }
    }, []);

    const fetchRankings = useCallback(async () => {
        if (!selectedMode) return;

        const cacheKey = { mode: selectedMode, page, option };
        const cachedData = rankingCache.get(cacheKey);

        if (cachedData) {
            setRankings(cachedData);
            return;
        }

        setLoading(true);
        try {
            const response = await fetchRankingApi(selectedMode, page, option);
            const rankingsData = response.data.data as RankingEntry[];
            setRankings(rankingsData);
            rankingCache.set(cacheKey, rankingsData);
        } catch (error) {
            console.error('Error fetching rankings:', error);
            setRankings([]);
        } finally {
            setLoading(false);
        }
    }, [selectedMode, page, option]);

    // Fetch modes on mount
    useEffect(() => {
        fetchModes();
    }, [fetchModes]);

    // Fetch rankings when dependencies change
    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    const handleModeChange = useCallback((modeId: string) => {
        setSelectedMode(modeId);
        setPage(1);
    }, []);

    const handleOptionChange = useCallback((value: string) => {
        setOption(value as RankingOption);
        setPage(1);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    return {
        modes,
        selectedMode,
        rankings,
        option,
        page,
        loading,
        modesLoading,
        handleModeChange,
        handleOptionChange,
        handlePageChange
    };
};