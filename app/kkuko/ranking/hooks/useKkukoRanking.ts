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
    const [detailedError, setDetailedError] = useState<ErrorMessage | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleError = useCallback((err: any, inputValue: string, location: string) => {
        const errorMsg: ErrorMessage = {
            ErrName: err.name || "Error",
            ErrMessage: err.message || "Unknown error",
            ErrStackRace: err.stack || null,
            inputValue: inputValue,
            location: location
        };
        setDetailedError(errorMsg);
        console.error(`Failed at ${location}:`, err);
    }, []);

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
            handleError(error, 'fetchModes', 'fetchModes');
            setModes([]);
        } finally {
            setModesLoading(false);
        }
    }, [handleError]);

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
            handleError(error, `mode: ${selectedMode}, page: ${page}, option: ${option}`, 'fetchRankings');
            setRankings([]);
        } finally {
            setLoading(false);
        }
    }, [selectedMode, page, option, handleError]);

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
        detailedError,
        setDetailedError,
        handleModeChange,
        handleOptionChange,
        handlePageChange
    };
};