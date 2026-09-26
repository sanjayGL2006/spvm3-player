# SPVM3 Player — Hi-Fi Studio & Glassmorphic Music Player

Full-stack modern music player with automatic local audio library discovery, multi-format ID3/MP4 metadata extraction, embedded album art rendering, playlist management, and high-fidelity audio streaming with HTTP 206 range seeking support.

Built with a **FastAPI** backend and a **React 18 + Vite** frontend featuring a Spotify/Apple Music-inspired glassmorphism UI.

---

## Key Features

- **Automatic Multi-Format Audio Library Sync**: Scans the `songs/` folder for `.mp3`, `.m4a`, `.flac`, `.wav`, and `.ogg` files. Deduplicates tracks, strips promotional website watermarks, and parses title, artist, album, duration, and embedded APIC/covr cover art via `mutagen`.
- **High-Fidelity Range Streaming**: Serves audio with HTTP partial-content range requests (`206 Partial Content`) for instantaneous, glitch-free seeking.
- **Glassmorphic Modern UI**: Curated obsidian dark palette (`#080b12`), frosted glass panels, neon gradient accents (`#8b5cf6` / `#06b6d4`), and modern typography via Google Fonts (Outfit & Inter).
- **Interactive Equalizer Spectrum & Canvas Visualizer**: High-DPI canvas spectrum visualizer and equalizers that react dynamically during active playback.
- **Up Next Queue Drawer**: Slide-out drawer displaying queued tracks with quick jump, track deletion, and clear queue options.
- **Full Playback Controls**: Play/pause, next/previous, smart shuffle, cycle repeat modes (Repeat All / Repeat One / Off), time elapsed/remaining toggle, progress scrub slider, and volume slider with mouse wheel support.
- **Playlists & Favorites**: Create, edit, and delete custom playlists, add/remove tracks directly from track list popovers, filter by curated genres (A.R. Rahman, Anirudh Hits, Melody, High Energy, Soundtrack), and save Favorites.
- **Toast Feedback & LocalStorage State**: Floating notifications for user actions and automatic local persistence of volume, mute state, shuffle, and repeat modes.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `←` / `→`: Seek backward / forward 5 seconds
  - `↑` / `↓`: Adjust volume up / down
  - `M`: Toggle Mute / Unmute
  - `N`: Next track
  - `P`: Previous track

---

## Tech Stack

- **Backend**: FastAPI, Mutagen (ID3, MP4, FLAC parser), Uvicorn, StaticFiles
- **Frontend**: React 18, Vite 5, Canvas API (waveform visualizer), Vanilla CSS with CSS custom properties

---

## API Endpoints

- `GET /api/tracks` — List all tracks (filters: `genre`, `search`, `playlist_id`)
- `GET /api/tracks/{track_id}` — Get track metadata
- `GET /api/tracks/{track_id}/stream` — Stream audio with HTTP 206 seek support
- `GET /api/tracks/{track_id}/cover` — Get embedded artwork or procedural SVG
- `GET /api/genres` — List discovered genres
- `GET /api/playlists` — List all playlists with track counts and covers
- `POST /api/playlists` — Create a new playlist
- `PUT /api/playlists/{playlist_id}` — Update playlist details
- `DELETE /api/playlists/{playlist_id}` — Delete custom playlist
- `POST /api/playlists/{playlist_id}/tracks` — Add track to playlist
- `DELETE /api/playlists/{playlist_id}/tracks/{track_id}` — Remove track from playlist
- `GET /api/favorites` — List favorite track IDs
- `POST /api/favorites/{track_id}` — Toggle track favorite status

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt --break-system-packages
python -m uvicorn main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Audio Library API: [http://localhost:8000/api/tracks](http://localhost:8000/api/tracks)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## Audio Library Management

Drop any `.mp3`, `.wav`, `.flac`, `.ogg`, or `.m4a` files into the `songs/` directory. The FastAPI backend will automatically discover them, extract embedded album art, clean promotional text, and provide streaming endpoints without any manual database configuration.