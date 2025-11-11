# VdoCipher Range Playback Demo

This repository contains a minimal Node.js server that proxies one-time password
(OTP) requests to VdoCipher and serves a browser-based player locked to the
10&ndash;15 second window of the video `e19a1e1c5d37cc89dfe44e4badee1ff2`.

## Prerequisites

- Node.js 18 or newer (the project was created with Node 22)
- A VdoCipher API secret with permissions to generate OTPs for the target video

## Configuration

Set the following environment variables before starting the server:

- `VDOCIPHER_API_SECRET` &ndash; **required**. Your VdoCipher API secret.
- `VDOCIPHER_VIDEO_ID` &ndash; optional. Defaults to
  `e19a1e1c5d37cc89dfe44e4badee1ff2`.
- `VDOCIPHER_API_BASE_URL` &ndash; optional. Defaults to
  `https://dev.vdocipher.com/api/videos`.
- `PORT` and `HOST` &ndash; optional. Default to `3000` and `0.0.0.0`.

Example (macOS/Linux):

```bash
export VDOCIPHER_API_SECRET="<your-api-secret>"
export PORT=3000
node server.js
```

On Windows PowerShell:

```powershell
$env:VDOCIPHER_API_SECRET = "<your-api-secret>"
node server.js
```

## Running the demo

1. Install dependencies (only built-in modules are required).
2. Start the server with `npm start` or `node server.js`.
3. Open `http://localhost:3000` in a browser. The page will request an OTP from
   VdoCipher through the Node proxy and play the authorised clip between 10s and
   15s. Seeking outside of this window rewinds the player back into range.

## Troubleshooting

- If the page displays "Unable to start playback", check the server logs for
  the underlying OTP error. Missing or incorrect API credentials are the most
  common causes.
- VdoCipher OTPs are single-use and short-lived. Refresh the page to request a
  new token.
