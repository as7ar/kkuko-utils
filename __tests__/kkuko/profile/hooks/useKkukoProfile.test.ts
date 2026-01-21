import { renderHook, act, waitFor } from '@testing-library/react';
import { useKkukoProfile } from '@/app/kkuko/profile/hooks/useKkukoProfile';
import * as api from '@/app/kkuko/shared/lib/api';

// Mock API
jest.mock('@/app/kkuko/shared/lib/api', () => ({
    fetchModes: jest.fn(),
    fetchTotalUsers: jest.fn(),
    fetchProfile: jest.fn(),
    fetchItems: jest.fn(),
    fetchExpRank: jest.fn()
}));

// Mock useRecentSearches
const mockSaveToRecentSearches = jest.fn();
const mockRemoveFromRecentSearches = jest.fn();
jest.mock('@/app/kkuko/profile/hooks/useRecentSearches', () => ({
    useRecentSearches: jest.fn(() => ({
        recentSearches: [],
        saveToRecentSearches: mockSaveToRecentSearches,
        removeFromRecentSearches: mockRemoveFromRecentSearches
    }))
}));

describe('useKkukoProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (api.fetchModes as jest.Mock).mockResolvedValue({ data: { status: 200, data: [] } });
        (api.fetchTotalUsers as jest.Mock).mockResolvedValue({ data: { status: 200, data: { totalUsers: 100 } } });
    });

    it('should fetch modes and total users on mount', async () => {
        const { result } = renderHook(() => useKkukoProfile());
        
        await waitFor(() => {
             expect(api.fetchModes).toHaveBeenCalled();
             expect(api.fetchTotalUsers).toHaveBeenCalled();
             expect(result.current.totalUserCount).toBe(100);
        });
    });

    it('should fetch profile successfully', async () => {
        const mockProfileData = {
            user: { id: 'test', nickname: 'Test', level: 1, exp: 0, exordial: '' },
            equipment: [{ itemId: 'item1', slot: 'head' }],
            presence: { updatedAt: new Date().toISOString() }
        };
        const mockItemsData = [{ id: 'item1', name: 'Item 1' }];

        (api.fetchProfile as jest.Mock).mockResolvedValue({ status: 200, data: { status: 200, data: mockProfileData } });
        (api.fetchItems as jest.Mock).mockResolvedValue({ data: { status: 200, data: mockItemsData } });
        (api.fetchExpRank as jest.Mock).mockResolvedValue({ data: { rank: 5 } });

        const { result } = renderHook(() => useKkukoProfile());

        await act(async () => {
            await result.current.fetchProfile('Test', 'nick');
        });

        expect(result.current.profileData).toEqual(mockProfileData);
        expect(result.current.itemsData).toEqual(mockItemsData);
        expect(result.current.expRank).toBe(5);
        expect(mockSaveToRecentSearches).toHaveBeenCalledWith('Test', 'nick');
    });

    it('should handle profile not found (status 404)', async () => {
         (api.fetchProfile as jest.Mock).mockResolvedValue({ status: 404 });
         
         const { result } = renderHook(() => useKkukoProfile());

         await act(async () => {
            await result.current.fetchProfile('Unknown', 'nick');
        });

        expect(result.current.error).toBe('등록된 유저가 아닙니다.');
        expect(result.current.profileData).toBeNull();
    });

    it('should handle API errors', async () => {
        (api.fetchProfile as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useKkukoProfile());

        await act(async () => {
            await result.current.fetchProfile('Test', 'nick');
        });

        expect(result.current.error).toBe('프로필을 불러오는데 실패했습니다.');
    });
});
