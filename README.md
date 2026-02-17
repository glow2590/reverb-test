# Reverb WebSocket Test App

A React TypeScript application for testing Laravel Reverb WebSocket connections.

## Features

- 🔌 WebSocket connection to Laravel Reverb server
- 🔐 JWT and R-Auth token authentication
- 📡 Private channel subscription
- 💬 Real-time message display
- 🔔 Desktop notifications
- 📊 Connection status monitoring

## Prerequisites

- Node.js 18+
- npm or yarn
- Laravel Reverb server running
- Valid JWT and R-Auth tokens from your Laravel application

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables:
   - `VITE_JWT_TOKEN` - Your JWT token from Laravel login
   - `VITE_R_AUTH_TOKEN` - Your R-Auth token from Laravel

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_REVERB_APP_KEY` | Reverb application key | `hhqyhg6am5vugdnkodtl` |
| `VITE_REVERB_HOST` | Reverb server host | `api.redstrim.com` |
| `VITE_REVERB_PORT` | Reverb server port | `443` |
| `VITE_REVERB_SCHEME` | Connection scheme | `https` |
| `VITE_AUTH_ENDPOINT` | Broadcasting auth endpoint | `https://api.redstrim.com/api/admin/broadcasting/auth` |
| `VITE_DEBUG` | Enable Pusher logging | `true` |
| `VITE_JWT_TOKEN` | JWT authentication token | - |
| `VITE_R_AUTH_TOKEN` | R-Auth token | - |

## Usage

1. Enter your JWT token and R-Auth token in the configuration section
2. Specify the channel name you want to subscribe to (e.g., `admin.alarm`)
3. Click "Subscribe" to connect and subscribe to the channel
4. Messages sent to the channel will appear in the messages section

## Project Structure

```
src/
├── components/
│   ├── ReverbTest.tsx    # Main test component
│   └── ReverbTest.css    # Component styles
├── config/
│   └── reverb.ts         # Reverb configuration
├── hooks/
│   └── useReverb.ts      # Custom hook for WebSocket connection
├── types/
│   └── reverb.ts         # TypeScript type definitions
├── App.tsx               # Root component
├── main.tsx              # Application entry point
└── vite-env.d.ts         # Vite environment types
```

## TypeScript Types

The application includes comprehensive TypeScript types for:

- `ReverbConfig` - WebSocket configuration
- `AuthHeaders` - Authentication headers
- `PusherOptions` - Pusher client options
- `ChannelMessage` - Message data structure
- `ConnectionStatus` - Connection state
- `ChannelState` - Channel subscription state

## Troubleshooting

### Connection fails with HTML response

Make sure the `Accept: application/json` header is included in auth requests. This is handled automatically in the `useReverb` hook.

### Authentication fails

- Verify your JWT token is valid and not expired
- Ensure R-Auth token matches the device identifier
- Check that the auth endpoint is accessible

### Channel subscription fails

- Verify the channel name is correct
- Ensure the user has permission to access the channel
- Check Laravel channel routes in `routes/channels.php`

## Related Files

- Laravel broadcasting config: `c:\laragon\www\ott\config\broadcasting.php`
- Laravel channels: `c:\laragon\www\ott\routes\channels.php`
- Reverb server config: `c:\laragon\www\ott\config\reverb.php`
