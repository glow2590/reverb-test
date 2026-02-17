/**
 * Reverb/Pusher Configuration Types
 */
export interface ReverbConfig {
  appKey: string;
  host: string;
  port: number;
  forceTLS: boolean;
  enabledTransports: ('ws' | 'wss')[];
  cluster: string;
  authEndpoint: string;
  debug: boolean;
}

/**
 * Authentication headers for Pusher
 */
export interface AuthHeaders {
  Authorization: string;
  'R-Auth': string;
  Accept: string;
}

/**
 * Pusher client options
 */
export interface PusherOptions {
  wsHost: string;
  wsPort: number;
  forceTLS: boolean;
  enabledTransports: ('ws' | 'wss')[];
  cluster: string;
  authEndpoint: string;
  auth: {
    headers: AuthHeaders;
  };
}

/**
 * Channel message data
 */
export interface ChannelMessage {
  message?: string;
  [key: string]: unknown;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

/**
 * Channel subscription state
 */
export interface ChannelState {
  name: string;
  subscribed: boolean;
  error?: string;
}
