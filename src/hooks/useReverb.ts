import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher, { Channel } from 'pusher-js';
import type { ReverbConfig, AuthHeaders, ConnectionStatus, ChannelMessage, ChannelState } from '../types/reverb';
import { getAuthHeaders } from '../config/reverb';

interface UseReverbOptions {
  config: ReverbConfig;
  jwtToken: string;
  channelName: string;
  generateRAuthToken: () => Promise<string | null>;
}

interface UseReverbReturn {
  connectionStatus: ConnectionStatus;
  channelState: ChannelState;
  messages: ChannelMessage[];
  error: string | null;
  subscribe: () => void;
  unsubscribe: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for Reverb/Pusher WebSocket connection
 */
export function useReverb({
  config,
  jwtToken,
  channelName,
  generateRAuthToken,
}: UseReverbOptions): UseReverbReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [channelState, setChannelState] = useState<ChannelState>({
    name: channelName,
    subscribed: false,
  });
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  // Enable Pusher logging in debug mode
  if (config.debug) {
    Pusher.logToConsole = true;
  }

  /**
   * Initialize Pusher connection
   */
  const initializePusher = useCallback((token: string) => {
    if (!jwtToken) {
      setError('JWT Token is required');
      return null;
    }

    const authHeaders: AuthHeaders = getAuthHeaders(jwtToken, token);

    const pusherOptions = {
      wsHost: config.host,
      wsPort: config.port,
      forceTLS: config.forceTLS,
      enabledTransports: config.enabledTransports,
      cluster: config.cluster,
      authEndpoint: config.authEndpoint,
      auth: {
        headers: authHeaders,
      },
    };

    const pusher = new Pusher(config.appKey, pusherOptions);

    // Connection events
    pusher.connection.bind('connected', () => {
      setConnectionStatus('connected');
      setError(null);
      console.log('Successfully connected to Reverb!');
    });

    pusher.connection.bind('connecting', () => {
      setConnectionStatus('connecting');
      console.log('Connecting to Reverb...');
    });

    pusher.connection.bind('disconnected', () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from Reverb');
    });

    pusher.connection.bind('error', (err: Error) => {
      setConnectionStatus('failed');
      setError(`Connection error: ${err.message}`);
      console.error('Connection Error:', err);
    });

    return pusher;
  }, [config, jwtToken]);

  /**
   * Subscribe to channel
   */
  const subscribe = useCallback(async () => {
    const newRAuthToken = await generateRAuthToken();
    if (!newRAuthToken) {
      setError('Failed to generate new R-Auth token for subscription.');
      return;
    }

    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    const pusher = initializePusher(newRAuthToken);
    if (!pusher) {
      return; // Error is set inside initializePusher
    }
    pusherRef.current = pusher;

    const channel = pusherRef.current.subscribe(`private-${channelName}`);
    channelRef.current = channel;

    // Subscription success
    channel.bind('pusher:subscription_succeeded', () => {
      setChannelState({
        name: channelName,
        subscribed: true,
      });
      console.log(`Successfully subscribed to channel: ${channelName}`);
    });

    // Subscription error
    channel.bind('pusher:subscription_error', (err: { message: string }) => {
      setChannelState({
        name: channelName,
        subscribed: false,
        error: err.message,
      });
      setError(`Subscription error: ${err.message}`);
      console.error('Subscription Error:', err);
    });

    // Listen for messages (default event name: 'message')
    channel.bind('message', (data: ChannelMessage) => {
      console.log('Received message:', data);
      setMessages((prev) => [...prev, data]);
    });

    // Listen for custom events if needed
    channel.bind_global((eventName: string, data: ChannelMessage) => {
      console.log(`Event: ${eventName}`, data);
    });
  }, [channelName, initializePusher, generateRAuthToken]);

  /**
   * Unsubscribe from channel
   */
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setChannelState({
        name: channelName,
        subscribed: false,
      });
      setMessages([]);
    }
  }, [channelName]);

  /**
   * Reconnect to Reverb
   */
  const reconnect = useCallback(() => {
    // Disconnect and clear refs
    if (channelRef.current) {
      channelRef.current.unbind_all();
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }

    // Reset state and attempt to subscribe again
    setConnectionStatus('disconnected');
    setChannelState({ name: channelName, subscribed: false });
    setError(null);

    // The subscribe function now handles token generation and connection
    subscribe();
  }, [subscribe, channelName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [unsubscribe]);

  return {
    connectionStatus,
    channelState,
    messages,
    error,
    subscribe,
    unsubscribe,
    reconnect,
  };
}
