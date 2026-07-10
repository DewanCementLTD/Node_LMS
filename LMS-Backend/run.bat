@echo off
REM Start the LMS FastAPI backend (production serves on port 8001)
REM host 0.0.0.0 = accept connections from all network interfaces
REM (required so physical Android devices can reach the server over Wi-Fi)
REM NOTE: no --reload in production. The reload watcher restarts the server
REM whenever files under this folder change (uploads, AI pipeline output,
REM code edits), dropping in-flight requests — and its stale worker can keep
REM serving OLD code long after the source has changed. Restart this script
REM manually after deploying backend changes.
uvicorn main:app --host 0.0.0.0 --port 8001
