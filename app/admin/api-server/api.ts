// API Server Admin API Functions
import axios from 'axios';
import type { CrawlerHealthResponse, SaveSessionRequest, SaveSessionResponse, RestartCrawlerResponse } from './types';
import { SCM } from '@/app/lib/supabaseClient';
import zlib from 'zlib';

const BASE_URL = 'https://api.solidloop-studio.xyz/api/v1';

// Get JWT token from Supabase session
const getAuthHeaders = async () => {
  // This should be replaced with actual Supabase session retrieval
  const token = await SCM.getJWT(); // TODO: Get from Supabase session
  return {
    Authorization: `${token}`,
  };
};

// Crawler APIs
export const fetchCrawlerHealth = async (): Promise<CrawlerHealthResponse> => {
  const headers = await getAuthHeaders();
  const response = await axios.get<CrawlerHealthResponse>(
    `${BASE_URL}/admin/crawler/health`,
    { headers }
  );
  return response.data;
};

export const saveCrawlerSession = async (
  data: SaveSessionRequest
): Promise<SaveSessionResponse> => {
  const headers = await getAuthHeaders();
  const response = await axios.post<SaveSessionResponse>(
    `${BASE_URL}/admin/crawler/session`,
    data,
    { headers }
  );
  return response.data;
};

export const restartCrawler = async (
  channelId: string
): Promise<RestartCrawlerResponse> => {
  const headers = await getAuthHeaders();
  const response = await axios.post<RestartCrawlerResponse>(
    `${BASE_URL}/admin/crawler/restart/${channelId}`,
    {},
    { headers }
  );
  return response.data;
};

// Logs APIs
const isGzip = (u8: Uint8Array) => u8 && u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;

const arrayBufferToString = async (buf: ArrayBuffer): Promise<string> => {
  const u8 = new Uint8Array(buf);
  console.log(isGzip(u8));
  if (isGzip(u8)) {
    const decompressed = zlib.gunzipSync(Buffer.from(buf));
    return decompressed.toString('utf-8');

  }

  // Not gzipped, decode as UTF-8
  return new TextDecoder().decode(buf);
};

export const fetchApiServerLogs = async (date?: string): Promise<string> => {
  const headers = await getAuthHeaders();
  const params = date ? { date } : {};
  const response = await axios.get<ArrayBuffer>(
    `${BASE_URL}/admin/logs/api-server`,
    { headers, params, responseType: 'arraybuffer' }
  );
  return await arrayBufferToString(response.data);
};

export const fetchCrawlerLogs = async (date?: string): Promise<string> => {
  const headers = await getAuthHeaders();
  const params = date ? { date } : {};
  const response = await axios.get<ArrayBuffer>(
    `${BASE_URL}/admin/logs/crawler`,
    { headers, params, responseType: 'arraybuffer' }
  );
  return await arrayBufferToString(response.data);
};
