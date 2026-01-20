'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import {
    fetchModes as fetchModesApi,
    fetchTotalUsers as fetchTotalUsersApi,
    fetchProfile as fetchProfileApi,
    fetchItems as fetchItemsApi,
    fetchExpRank as fetchExpRankApi
} from '../profile/api';
import TryRenderImg from './TryRenderImg';
import { Equipment, ItemInfo, KkukoRecord, Mode, ProfileData } from '@/types/kkuko.types'
import { NICKNAME_COLORS, OPTION_NAMES, SLOT_NAMES } from './const';

export default function KkukoProfile() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'nick' | 'id'>('nick');
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [itemsData, setItemsData] = useState<ItemInfo[]>([]);
    const [modesData, setModesData] = useState<Mode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [totalUserCount, setTotalUserCount] = useState<number>(0);
    const [expRank, setExpRank] = useState<number | null>(null);
    const [imgLoadedCount, setImgLoadedCount] = useState(0);

    // Load modes on mount
    useEffect(() => {
        fetchModes();
        fetchTotalUsers();
    }, []);

    // Handle URL query parameters
    useEffect(() => {
        const nick = searchParams.get('nick');
        const id = searchParams.get('id');

        if (nick) {
            setSearchQuery(nick);
            setSearchType('nick');
            fetchProfile(nick, 'nick');
        } else if (id) {
            setSearchQuery(id);
            setSearchType('id');
            fetchProfile(id, 'id');
        }
        setImgLoadedCount(0);
    }, [searchParams]);

    const fetchModes = async () => {
        try {
            const response = await fetchModesApi();
            const result = await response.data;
            if (result.status === 200) {
                setModesData(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch modes:', err);
        }
    };

    const fetchTotalUsers = async () => {
        try {
            const response = await fetchTotalUsersApi();
            const result = await response.data;
            if (result.status === 200) {
                setTotalUserCount(result.data.totalUsers);
            }
        } catch (err) {
            console.error('Failed to fetch total users:', err);
        }
    };

    const fetchProfile = async (query: string, type: 'nick' | 'id') => {
        setLoading(true);
        setError(null);
        setProfileData(null);

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
            }
        } catch (err) {
            setError('프로필을 불러오는데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async (itemIds: string) => {
        try {
            const response = await fetchItemsApi(itemIds);
            const result = await response.data;
            if (result.status === 200) {
                setItemsData(Array.isArray(result.data) ? result.data : [result.data]);
            }
        } catch (err) {
            console.error('Failed to fetch items:', err);
        }
    };

    const fetchExpRank = async (userId: string) => {
        try {
            const response = await fetchExpRankApi(userId);
            setExpRank(response.data.rank);
        } catch (err) {
            console.error('Failed to fetch exp rank:', err);
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        const queryParam = searchType === 'nick' ? 'nick' : 'id';
        router.push(`/kkuko/profile?${queryParam}=${encodeURIComponent(searchQuery)}`);
        fetchProfile(searchQuery, searchType);
        setImgLoadedCount(0);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getNicknameColor = (equipment: Equipment[]): string => {
        const nikItem = equipment.find(eq => eq.slot === 'NIK');
        if (!nikItem) return localStorage.getItem('theme') === 'dark' ? '#FFFFFF' : '#000000';

        const colorKey = nikItem.itemId.toLowerCase().replace('_name', '');
        return NICKNAME_COLORS[colorKey] || (localStorage.getItem('theme') === 'dark' ? '#FFFFFF' : '#000000');
    };

    const extractColorFromLabel = (description: string): string => {
        const match = description.match(/<label class='x-([^']+)'>.*?<\/label>/);
        if (!match) return localStorage.getItem('theme') === 'dark' ? '#FFFFFF' : '#000000';

        const colorKey = match[1].toLowerCase().replace('_name', '');
        return NICKNAME_COLORS[colorKey] || (localStorage.getItem('theme') === 'dark' ? '#FFFFFF' : '#000000');
    };

    const formatNumber = (num: number): string => {
        return (num / 1000).toString();
    };

    const calculateTotalOptions = () => {
        const totals: Record<string, number> = {};

        itemsData.forEach(item => {
            Object.entries(item.options).forEach(([key, value]) => {
                if (value !== undefined && !isNaN(value)) {
                    totals[key] = (totals[key] || 0) + Number(value) * 1000;
                }
            });
        });

        return totals;
    };

    const getModeName = (modeId: string): string => {
        const mode = modesData.find(m => m.modeId === modeId);
        return mode ? mode.modeName : modeId;
    };

    const getModeGroup = (modeId: string): string => {
        const mode = modesData.find(m => m.modeId === modeId);
        return mode ? mode.group : 'unknown';
    };

    const groupRecordsByMode = () => {
        const groups: Record<string, KkukoRecord[]> = {
            kor: [],
            eng: [],
            event: []
        };

        profileData?.record.forEach(rec => {
            const group = getModeGroup(rec.modeId);
            if (groups[group]) {
                groups[group].push(rec);
            }
        });

        return groups;
    };

    const calculateWinRate = (win: number, total: number): string => {
        if (total === 0) return '0.00';
        return ((win / total) * 100).toFixed(2);
    };

    const formatObservedAt = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getSlotName = (slot: string): string => {
        return SLOT_NAMES[slot] || slot;
    };

    const getOptionName = (key: string): string => {
        return OPTION_NAMES[key] || key;
    };

    const formatLastSeen = (updatedAt: string): string => {
        const lastSeen = new Date(updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - lastSeen.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays}일 전`;
        } else if (diffHours > 0) {
            return `${diffHours}시간 전`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes}분 전`;
        }
    };

    const parseDescriptionWithColors = (description: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        const regex = /<label class='x-([^']+)'>([^<]*)<\/label>/g;
        let lastIndex = 0;
        let match;
        let key = 0;

        while ((match = regex.exec(description)) !== null) {
            // Add text before the label
            if (match.index > lastIndex) {
                parts.push(
                    <span key={key++}>{description.substring(lastIndex, match.index)}</span>
                );
            }

            // Add colored label text
            const colorKey = match[1].toLowerCase().replace('_name', '');
            const color = NICKNAME_COLORS[colorKey] || '#000000';
            const text = match[2];

            parts.push(
                <span key={key++} style={{ color }}>{text}</span>
            );

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < description.length) {
            parts.push(
                <span key={key++}>{description.substring(lastIndex)}</span>
            );
        }

        return <>{parts}</>;
    };

    const lvImgPlaceholder = () => (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center z-10">
            <span className="text-xs text-gray-400 dark:text-gray-500">Lv</span>
        </div>
    )

    const itemImgPlaceholder = () => (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-400 dark:text-gray-500 text-center">아이템<br />이미지</span>
        </div>
    )

    const characterLayers = useMemo(() => {
        if (!profileData) return [];

        const layerOrder = ['back', 'avatar', 'eye', 'mouth', 'facedeco', 'eyedeco', 'shoes', 'clothes', 'dressdeco', 'head', 'hairdeco', 'hand', 'front', 'badge'];
        
        // Group items by their slot for proper identification
        const itemsBySlot: Record<string, ItemInfo> = {};
        const currentItems = itemsData || [];

        currentItems.forEach(item => {
            const equipment = profileData?.equipment.find(eq => eq.itemId === item.id);
            if (equipment && equipment.slot !== 'NIK' && equipment.slot !== 'BDG') {
                itemsBySlot[equipment.slot] = item;
            } else if (equipment && equipment.slot === 'BDG') {
                itemsBySlot['badge'] = item;
            }
        });

        // Ensure avatar exists, if not add default
        if (!itemsBySlot['Mavatar']) {
            itemsBySlot['Mavatar'] = {
                id: 'def',
                name: 'def',
                description: '',
                updatedAt: 0,
                group: 'avatar',
                options: {}
            };
        }

        // Render layers in order
        const layers: { key: string; url: string; alt: string; className?: string }[] = [];
        
        layerOrder.forEach((group, index) => {
            // Check for left hand and right hand separately if group is 'hand'
            if (group === 'hand') {
                // Render left hand (Mlhand)
                const leftHandItem = itemsBySlot['Mlhand'];
                if (leftHandItem) {
                    const imageName = leftHandItem.id;
                    const imageUrl = `/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/hand/${imageName}.png`;
                    
                    layers.push({
                        key: `hand-left-${index}`,
                        url: imageUrl,
                        alt: "left hand layer",
                        className: "transition-opacity duration-300"
                    });
                }
                
                // Render right hand (Mrhand)
                const rightHandItem = itemsBySlot['Mrhand'];
                if (rightHandItem) {
                    const imageName = rightHandItem.id;
                    const imageUrl = `/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/hand/${imageName}.png`;
                    
                    layers.push({
                        key: `hand-right-${index}`,
                        url: imageUrl,
                        alt: "right hand layer",
                        className: "transition-opacity duration-300 scale-x-[-1]"
                    });
                }
            } else {
                // For other groups, check with M prefix
                const slotKey = `M${group}`;
                const item = itemsBySlot[slotKey] || itemsBySlot[group];
                
                if (item) {
                    const imageName = item.name === 'def' ? 'def' : item.id;
                    const imageUrl = `/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/${group}/${imageName}.png`;

                    layers.push({
                        key: `${group}-${index}`,
                        url: imageUrl,
                        alt: `${group} layer`,
                        className: "transition-opacity duration-300"
                    });
                } else {
                    const itemId = 'def';
                    const imageUrl = `/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/${group}/${itemId}.png`;
                    layers.push({
                        key: `${group}-${index}`,
                        url: imageUrl,
                        alt: `${group} default layer`,
                        className: "transition-opacity duration-300"
                    });
                }
            }
        });
        
        return layers;
    }, [profileData, itemsData]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Title Section */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                끄투코리아 유저 조회 {totalUserCount > 0 && `(등록된 유저수 ${totalUserCount.toLocaleString()})`}
            </h1>

            {/* Search Section */}
            <div className="mb-8">
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="유저 검색..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value as 'nick' | 'id')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="nick">닉네임</option>
                        <option value="id">ID</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={loading}
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
                    <p className="text-red-600 dark:text-red-500 text-sm mt-2">
                        2026-01-18 17시 이후 게임 접속한 유저에 대해서 조회할 수 있습니다.
                    </p>
                </div>
            )}

            {/* Profile Data */}
            {profileData && !loading && (
                <div className="space-y-6">
                    {/* User Profile Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex gap-6">
                            {/* Left: Character Image and Badges */}
                            <div className="flex flex-col gap-3 flex-shrink-0">
                                {/* Character Image */}
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    {imgLoadedCount < characterLayers.length && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                    {characterLayers.map((layer) => (
                                        <div
                                            key={layer.key}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <TryRenderImg
                                                placeholder={<div className="w-48 h-48" />}
                                                url={layer.url}
                                                alt={layer.alt}
                                                width={192}
                                                height={192}
                                                className={layer.className}
                                                hanldeLoad={() => setImgLoadedCount(prev => prev + 1)}
                                                onFailure={() => setImgLoadedCount(prev => prev + 1)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Badges (pbdg slot items) */}
                                {profileData.equipment.filter(eq => eq.slot === 'pbdg').length > 0 && (
                                    <div className="flex flex-wrap gap-2 w-48">
                                        {profileData.equipment
                                            .filter(eq => eq.slot === 'pbdg')
                                            .map(eq => {
                                                const item = itemsData.find(i => i.id === eq.itemId);
                                                if (!item) return null;
                                                return (
                                                    <div
                                                        key={eq.itemId}
                                                        className="relative group"
                                                        title={item.name}
                                                    >
                                                        <div className="relative w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                                                            <TryRenderImg
                                                                placeholder={<div className="w-10 h-10" />}
                                                                url={`/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/badge/${item.id}.png`}
                                                                alt={item.name}
                                                                width={40}
                                                                height={40}
                                                                className="transition-opacity duration-300"
                                                            />
                                                        </div>
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                            {item.name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* Right: User Info */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h2
                                        className="text-3xl font-bold"
                                        style={{ color: getNicknameColor(profileData.equipment) }}
                                    >
                                        {profileData.user.nickname}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{profileData.user.exordial}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {profileData.user.id}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">경험치</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{profileData.user.exp.toLocaleString()} EXP</p>
                                        {expRank !== null && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">경험치 랭킹: #{expRank.toLocaleString()}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">레벨</p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-8 h-8 flex-shrink-0">
                                                <TryRenderImg
                                                    placeholder={lvImgPlaceholder()}
                                                    url={`/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/lv/lv${String(profileData.user.level).padStart(4, '0')}.png`}
                                                    alt="Level Icon"
                                                    width={32}
                                                    height={32}
                                                    className={`rounded transition-opacity duration-300`}
                                                />
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                Lv. {profileData.user.level}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">마지막 관측</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatObservedAt(profileData.user.observedAt)}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">접속 상태</p>
                                        <p className="text-lg font-semibold">
                                            {profileData.presence.channelId ? (
                                                <span className="text-green-600 dark:text-green-400">온라인</span>
                                            ) : (
                                                <span className="text-gray-500 dark:text-gray-400">오프라인</span>
                                            )}
                                        </p>
                                        {profileData.presence.channelId ? (
                                            <p className="text-xs text-gray-600 dark:text-gray-400">채널: {profileData.presence.channelId}</p>
                                        ) : (
                                            <p className="text-xs text-gray-600 dark:text-gray-400">마지막 접속: {formatLastSeen(profileData.presence.updatedAt)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">방 정보</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {profileData.presence.roomId ? (
                                                <span>방 {profileData.presence.roomId}</span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">미입장</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">착용 아이템 정보</h3>
                            <button
                                onClick={() => setShowItemModal(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                보기
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(calculateTotalOptions()).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{getOptionName(key)}</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value > 0 ? '+' : ''}{formatNumber(value)}{key[0]==='g' ? '%p' : ''}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Records Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">전적</h3>
                        <div className="space-y-6">
                            {Object.entries(groupRecordsByMode()).map(([groupName, records]) => (
                                records.length > 0 && (
                                    <div key={groupName}>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 capitalize">
                                            {groupName === 'kor' ? '한국어' : groupName === 'eng' ? '영어' : '이벤트'}
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">모드</th>
                                                        <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">총 게임</th>
                                                        <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">승리</th>
                                                        <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">승률</th>
                                                        <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">경험치</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {records.map((rec) => (
                                                        <tr key={rec.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{getModeName(rec.modeId)}</td>
                                                            <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{rec.total.toLocaleString()}</td>
                                                            <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{rec.win.toLocaleString()}</td>
                                                            <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{calculateWinRate(rec.win, rec.total)}%</td>
                                                            <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{rec.exp.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-30">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">장착 아이템 목록</h3>
                            <button
                                onClick={() => setShowItemModal(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4 relative">
                            {itemsData.map((item) => {
                                const equipment = profileData?.equipment.find(eq => eq.itemId === item.id);
                                const slotName = equipment ? getSlotName(equipment.slot) : '알 수 없음';
                                const isNikItem = equipment?.slot === 'NIK';
                                const nikColor = isNikItem ? extractColorFromLabel(item.description) : '#000000';

                                // Get the image group from equipment slot
                                const getImageGroup = () => {
                                    if (!equipment) return null;
                                    if (equipment.slot === 'NIK') return null; // No image for nickname items
                                    if (equipment.slot === 'BDG' || equipment.slot === 'pbdg') return 'badge';
                                    if (equipment.slot.startsWith('Ml') || equipment.slot.startsWith('Mr')) return 'hand';
                                    // Remove 'M' prefix from slot name (e.g., 'Mavatar' -> 'avatar')
                                    return equipment.slot.startsWith('M') ? equipment.slot.substring(1).toLowerCase() : equipment.slot.toLowerCase();
                                };

                                const imageGroup = getImageGroup();

                                return (
                                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex gap-4">
                                            {/* Item Image */}
                                            {imageGroup && (
                                                <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    <TryRenderImg
                                                        placeholder={itemImgPlaceholder()}
                                                        url={`/api/kkuko/image?url=https://cdn.kkutu.co.kr/img/kkutu/moremi/${imageGroup}/${item.id}.png`}
                                                        alt={item.name}
                                                        width={80}
                                                        height={80}
                                                        className="transition-opacity duration-300"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4
                                                        className="font-bold text-lg"
                                                        style={isNikItem ? { color: nikColor } : {}}
                                                    >
                                                        {item.name}
                                                    </h4>
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                        {slotName}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                                    {parseDescriptionWithColors(item.description)}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(item.options).map(([key, value]) => (
                                                        value !== undefined && (
                                                            <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">{getOptionName(key)}: </span>
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{value > 0 ? '+' : ''}{formatNumber(value * 1000)}{key[0]==='g' ? '%p' : ''}</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
