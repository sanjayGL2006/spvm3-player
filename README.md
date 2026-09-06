# SPVM3 Player

Full-stack modern music player with automatic local audio library discovery, ID3 tag extraction, embedded album art rendering, and audio streaming with HTTP 206 range seeking support.

Built with a **FastAPI** backend and a **React 18 + Vite** frontend featuring a Spotify/Apple Music-inspired glassmorphism UI.

---

## Key Features

- **Automatic Audio Library Sync**: Scans the `songs/` folder, deduplicates tracks, strips promotional watermarks, and parses title, artist, album, duration, and embedded APIC cover art via `mutagen`.
- **High-Fidelity Audio Streaming**: Serves files with HTTP partial-content range requests (`206 Partial Content`) for instantaneous, glitch-free seeking.
- **Glassmorphic Modern UI**: Curated obsidian dark palette (`#080b12`), frosted glass panels, neon gradient accents (`#8b5cf6` / `#06b6d4`), and modern typography via Google Fonts (Outfit & Inter).
- **Interactive Equalizer & Audio Waveform**: Animated frequency visualizer bars that bounce dynamically during active playback.
- **Up Next Queue**: Slide-out drawer displaying queued tracks with quick jump and reordering.
- **Full Playback Controls**: Play/pause, next/previous, smart shuffle, cycle repeat modes (Repeat All / Repeat One / Off), smooth progress scrub slider, and volume slider with quick mute toggle.
- **Playlists & Favorites**: Create custom playlists, filter by curated genres (A.R. Rahman, Anirudh Hits, Melody, High Energy, Soundtrack), and like tracks to build your Favorites library.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `←` / `→`: Seek backward / forward 5 seconds
  - `↑` / `↓`: Adjust volume up / down
  - `M`: Toggle Mute / Unmute
  - `N`: Next track
  - `P`: Previous track

---

## Tech Stack

- **Backend**: FastAPI, Mutagen (ID3 parser), Uvicorn, StaticFiles
- **Frontend**: React 18, Vite, Canvas API (waveform visualizer), Vanilla CSS with CSS custom properties

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt --break-system-packages
python -m uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Audio Library: [http://localhost:8000/api/tracks](http://localhost:8000/api/tracks)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## Audio Library Management

Drop any `.mp3`, `.wav`, or `.m4a` files into the `songs/` directory. The FastAPI backend will automatically discover them, extract embedded album art, clean promotional text, and provide streaming endpoints without any manual database configuration.