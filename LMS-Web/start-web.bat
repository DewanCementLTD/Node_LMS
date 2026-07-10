@echo off
REM Serve the LMS web portal in PRODUCTION mode.
REM
REM Do NOT serve users with "npm run dev": development mode keeps a hot-reload
REM (HMR) websocket open to the browser. Behind the hrms.dewancement.com proxy
REM that websocket cannot connect, and the dev client keeps re-syncing --
REM that is exactly the "app refreshes every few minutes" problem and the
REM console spam: "WebSocket connection to wss://.../_next/webpack-hmr failed".
REM Production mode has no HMR socket, so the reloads disappear.
REM
REM Usage: run this after every code update, on the machine that serves the site.
call npm run build
if errorlevel 1 (
  echo Build failed - fix the errors above, the old server keeps running.
  exit /b 1
)
REM Adjust -p if the site is proxied from a different port.
call npx next start -p 3000
