import { useState, useEffect, useCallback } from 'react';
import {
    fetchModes as fetchModesApi,
    fetchTotalUsers as fetchTotalUsersApi,
    fetchProfile as fetchProfileApi,
    fetchItems as fetchItemsApi,
    fetchExpRank as fetchExpRankApi
} from '../../shared/lib/api';
import { Equipment, ItemInfo, Mode, ProfileData } from '@/types/kkuko.types';
import { useRecentSearches } from './useRecentSearches';

export const useKkukoProfile = () => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [itemsData, setItemsData] = useState<ItemInfo[]>([]);
    const [modesData, setModesData] = useState<Mode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailedError, setDetailedError] = useState<ErrorMessage | null>(null);
    const [totalUserCount, setTotalUserCount] = useState<number>(0);
    const [expRank, setExpRank] = useState<number | null>(null);
    
    // Recent searches hook integration
    const { recentSearches, saveToRecentSearches, removeFromRecentSearches } = useRecentSearches();

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
        try {
            const response = await fetchModesApi();
            const result = await response.data;
            if (result.status === 200) {
                setModesData(result.data);
            }
        } catch (err) {
            handleError(err, 'fetchModes', 'fetchModes');
        }
    }, [handleError]);

    const fetchTotalUsers = useCallback(async () => {
        try {
            const response = await fetchTotalUsersApi();
            const result = await response.data;
            if (result.status === 200) {
                setTotalUserCount(result.data.totalUsers);
            }
        } catch (err) {
            handleError(err, 'fetchTotalUsers', 'fetchTotalUsers');
        }
    }, [handleError]);


    const fetchItems = useCallback(async (itemIds: string) => {
        try {
            const response = await fetchItemsApi(itemIds);
            const result = await response.data;
            if (result.status === 200) {
                const newItems = Array.isArray(result.data) ? result.data : [result.data];
                setItemsData(newItems);
            }
        } catch (err) {
            handleError(err, itemIds, 'fetchItems');
        }
    }, [handleError]);

    const fetchExpRank = useCallback(async (userId: string) => {
        try {
            const response = await fetchExpRankApi(userId);
            setExpRank(response.data.rank);
        } catch (err) {
            handleError(err, userId, 'fetchExpRank');
        }
    }, [handleError]);

    const fetchProfile = useCallback(async (query: string, type: 'nick' | 'id') => {
        setLoading(true);
        setError(null);
        setDetailedError(null);
        setProfileData(null);
        setItemsData([]); 
        setExpRank(null);

        try {
            const response = await fetchProfileApi(query, type);

            if (response.status === 404) {
                setError('등록된 유저가 아닙니다.');
                setLoading(false);
                return;
            }

            const result = await response.data;

            if (result.status === 200) {
                setProfileData(result.data);

                // Fetch items data
                if (result.data.equipment.length > 0) {
                    const itemIds = result.data.equipment.map((eq: Equipment) => eq.itemId).join(',');
                    fetchItems(itemIds);
                }

                // Fetch exp rank
                fetchExpRank(result.data.user.id);
                
                // Save to recent searches
                saveToRecentSearches(query, type);
            }
        } catch (err) {
            setError('프로필을 불러오는데 실패했습니다.');
            handleError(err, query, 'fetchProfile');
        } finally {
            setLoading(false);
        }
    }, [fetchItems, fetchExpRank, saveToRecentSearches, handleError]);

    // Initial load
    useEffect(() => {
        fetchModes();
        fetchTotalUsers();
    }, [fetchModes, fetchTotalUsers]);

    return {
        profileData,
        itemsData,
        modesData,
        loading,
        error,
        detailedError,
        setDetailedError,
        totalUserCount,
        expRank,
        recentSearches,
        fetchProfile,
        removeFromRecentSearches
    };
};
