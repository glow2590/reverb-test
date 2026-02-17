import { useState, useEffect } from 'react';
import { useReverb } from '../hooks/useReverb';
import { useLogin } from '../hooks/useLogin';
import { reverbConfig, PREDEFINED_USERS, DEFAULT_PASSWORD } from '../config/reverb';
import type { ConnectionStatus, ChannelMessage } from '../types/reverb';
import './ReverbTest.css';

/**
 * Connection status indicator component
 */
function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const statusColors: Record<ConnectionStatus, string> = {
    disconnected: 'status-disconnected',
    connecting: 'status-connecting',
    connected: 'status-connected',
    failed: 'status-failed',
  };

  return (
    <div className={`status-indicator ${statusColors[status]}`}>
      <span className="status-dot"></span>
      <span className="status-text">{status.toUpperCase()}</span>
    </div>
  );
}

/**
 * Message list component
 */
function MessageList({ messages }: { messages: ChannelMessage[] }) {
  if (messages.length === 0) {
    return <div className="no-messages">No messages received yet</div>;
  }

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className="message-item">
          <span className="message-time">{new Date().toLocaleTimeString()}</span>
          <span className="message-content">
            {typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message || msg, null, 2)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Main Reverb Test Component with Login Form
 */
export function ReverbTest() {
  const [channelName, setChannelName] = useState<string>('admin.alarm');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState<boolean>(false);

  // Login form state
  const [selectedUser, setSelectedUser] = useState<string>(PREDEFINED_USERS[0].email);
  const [password, setPassword] = useState<string>(DEFAULT_PASSWORD);

  // Use login hook
  const {
    isLoading: isLoggingIn,
    error: loginError,
    jwtToken,
    rAuthToken,
    user,
    login,
    logout,
    loadStoredTokens,
  } = useLogin();

  // Load stored tokens on mount
  useEffect(() => {
    loadStoredTokens();
  }, [loadStoredTokens]);

  // Use Reverb hook with tokens from login
  const {
    connectionStatus,
    channelState,
    messages,
    error: reverbError,
    subscribe,
    unsubscribe,
    reconnect,
  } = useReverb({
    config: reverbConfig,
    jwtToken: jwtToken || '',
    rAuthToken: rAuthToken || '',
    channelName,
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show notification for new messages
  useEffect(() => {
    if (
      messages.length > 0 &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const lastMessage = messages[messages.length - 1];
      new Notification('New Message', {
        body: lastMessage.message || JSON.stringify(lastMessage),
      });
    }
  }, [messages]);

  const handleLogin = async () => {
    const success = await login(selectedUser, password);
    if (success) {
      console.log('Login successful');
    }
  };

  const handleLogout = () => {
    if (isSubscribed) {
      unsubscribe();
      setIsSubscribed(false);
    }
    logout();
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      unsubscribe();
      setIsSubscribed(false);
    } else {
      subscribe();
      setIsSubscribed(true);
    }
  };

  const handleReconnect = () => {
    setIsSubscribed(false);
    reconnect();
  };

  const isLoginDisabled = !selectedUser || !password || isLoggingIn;
  const isSubscribeDisabled = !jwtToken || !rAuthToken || isLoggingIn;

  return (
    <div className="reverb-test-container">
      <header className="reverb-header">
        <h1>Reverb WebSocket Test</h1>
        <StatusIndicator status={connectionStatus} />
      </header>

      {/* Authentication Section */}
      <section className="auth-section">
        <div className="auth-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            JWT Authentication
          </h2>
          <button
            className="toggle-btn"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          >
            {isFormCollapsed ? '▼' : '◀'}
          </button>
        </div>

        {!isFormCollapsed && (
          <div className="auth-content">
            {/* Login Form */}
            {!user ? (
              <div className="login-form">
                <div className="form-group">
                  <label htmlFor="user-select">Select User:</label>
                  <select
                    id="user-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    disabled={isLoggingIn}
                  >
                    {PREDEFINED_USERS.map((u) => (
                      <option key={u.email} value={u.email}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="password-input">Password:</label>
                  <input
                    type="password"
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={handleLogin}
                  disabled={isLoginDisabled}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="spinner"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                      Login
                    </>
                  )}
                </button>

                {loginError && (
                  <div className="error-box">
                    {loginError}
                  </div>
                )}
              </div>
            ) : (
              /* Logged In State */
              <div className="logged-in-state">
                <div className="user-info">
                  <div className="info-item">
                    <span className="info-label">Logged in as:</span>
                    <span className="info-value">
                      {user.first_name} {user.last_name} ({user.email})
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">JWT Token:</span>
                    <span className="info-value success">Active</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">R-Auth Token:</span>
                    <span className="info-value success">Active</span>
                  </div>
                </div>

                <button
                  className="btn btn-danger btn-full"
                  onClick={handleLogout}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Configuration Section */}
      <section className="config-section">
        <h2>Configuration</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Channel Name:</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g., admin.alarm"
              disabled={isSubscribed}
            />
          </div>
        </div>
      </section>

      {/* Connection Info */}
      <section className="info-section">
        <h2>Connection Info</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Host:</span>
            <span className="info-value">{reverbConfig.host}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Port:</span>
            <span className="info-value">{reverbConfig.port}</span>
          </div>
          <div className="info-item">
            <span className="info-label">TLS:</span>
            <span className="info-value">{reverbConfig.forceTLS ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Auth Endpoint:</span>
            <span className="info-value">{reverbConfig.authEndpoint}</span>
          </div>
        </div>
      </section>

      {/* Channel Status */}
      <section className="channel-section">
        <h2>Channel Status</h2>
        <div className="channel-info">
          <div className="info-item">
            <span className="info-label">Channel:</span>
            <span className="info-value">private-{channelName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Subscribed:</span>
            <span className={`info-value ${channelState.subscribed ? 'subscribed' : ''}`}>
              {channelState.subscribed ? 'Yes' : 'No'}
            </span>
          </div>
          {channelState.error && (
            <div className="error-message">
              <span className="info-label">Error:</span>
              <span className="info-value error">{channelState.error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Error Display */}
      {(reverbError || loginError) && (
        <section className="error-section">
          <div className="error-box">
            <h3>Error</h3>
            <p>{reverbError || loginError}</p>
          </div>
        </section>
      )}

      {/* Messages */}
      <section className="messages-section">
        <h2>Messages ({messages.length})</h2>
        <MessageList messages={messages} />
      </section>

      {/* Actions */}
      <section className="actions-section">
        <button
          className={`btn ${isSubscribed ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleSubscribe}
          disabled={isSubscribeDisabled || !user}
        >
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
        <button className="btn btn-secondary" onClick={handleReconnect}>
          Reconnect
        </button>
        <button
          className="btn btn-warning"
          onClick={() => {
            if (isSubscribed) {
              unsubscribe();
              subscribe();
            }
          }}
          disabled={messages.length === 0}
        >
          Clear Messages
        </button>
      </section>
    </div>
  );
}
