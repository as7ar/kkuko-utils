// API Server Admin Types

export interface ChannelHealth {
  id: string;
  healthy: boolean;
}

export interface CrawlerHealthResponse {
  channels: ChannelHealth[];
}

export interface SaveSessionRequest {
  channelId: string;
  jwtToken: string;
  refreshToken: string;
}

export interface SaveSessionResponse {
  message: string;
}
