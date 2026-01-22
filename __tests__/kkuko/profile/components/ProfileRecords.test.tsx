import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileRecords from '@/app/kkuko/profile/components/ProfileRecords';
import { Mode } from '@/app/types/kkuko.types';

// Mock helper functions
jest.mock('@/app/kkuko/profile/utils/profileHelper', () => ({
  groupRecordsByMode: jest.fn(() => ({
    kor: [
      { id: '1', modeId: 'kr_word', total: 10, win: 5, exp: 100 },
    ],
    eng: [],
  })),
  getModeName: jest.fn(() => '한국어 끝말잇기'),
  calculateWinRate: jest.fn(() => '50.0'),
}));

describe('ProfileRecords', () => {
    const mockModesData: Mode[] = [
        { id: 'kr_word', name: '한국어 끝말잇기', category: 'kor' },
    ];
    const mockProfileData: any = {
        record: [
            { id: '1', modeId: 'kr_word', total: 10, win: 5, exp: 100 },
        ],
    };

    it('should render records correctly', () => {
        render(<ProfileRecords profileData={mockProfileData} modesData={mockModesData} />);

        expect(screen.getByText('전적')).toBeInTheDocument();
        expect(screen.getByText('한국어')).toBeInTheDocument();
        expect(screen.getByText('한국어 끝말잇기')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // total
        expect(screen.getByText('5')).toBeInTheDocument(); // win
        expect(screen.getByText('50.0%')).toBeInTheDocument(); // rate
        expect(screen.getByText('100')).toBeInTheDocument(); // exp
    });
});
