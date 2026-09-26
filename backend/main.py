"""
SPVM3 Player - FastAPI Backend
Auto-discovers and serves audio tracks from the local songs directory.
Extracts ID3, MP4, FLAC metadata, durations, and embedded album covers.
Provides playlist management, favorites tracking, and audio streaming with HTTP 206 range seeking support.
"""
import os
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from urllib.parse import quote
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel

try:
    import mutagen
    from mutagen.mp3 import MP3
    from mutagen.mp4 import MP4
    from mutagen.flac import FLAC
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False

app = FastAPI(title="SPVM3 Player API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve songs directory
BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
SONGS_DIR = PROJECT_DIR / "songs"

if not SONGS_DIR.exists():
    SONGS_DIR.mkdir(exist_ok=True)

# Mount /songs and /api/songs for static streaming
app.mount("/songs", StaticFiles(directory=str(SONGS_DIR)), name="songs")

def clean_watermark(text: Optional[str]) -> str:
    """Strip promotional tags and website domain watermarks from titles and artists."""
    if not text:
        return ""
    # Strip site names, kbps tags, tamil/telugu promo watermarks
    text = re.sub(
        r'[-_ ]*(MassTamilan\.[a-z0-9]+|PagalWorld|320\s*Kbps|128\s*Kbps|Tamil\s*song|Sensongs|Isaimini|Starmusiq|NaaSongs|Mp3Tez)',
        '', text, flags=re.I
    )
    text = re.sub(r'\s*\(\d+\)$', '', text)
    text = re.sub(r'\s*!+\s*', ' ', text)
    cleaned = text.strip(" -_")
    return cleaned if cleaned else (text or "")

def derive_genre(title: str, artist: str, album: str, raw_genre: str) -> str:
    """Classify track into curated genre categories based on metadata keywords."""
    combined = f"{title} {artist} {album}".lower()
    if any(k in combined for k in ["rahman", "shivoham", "sol", "singappenney", "veera", "arujuna"]):
        return "A.R. Rahman"
    if any(k in combined for k in ["anirudh", "vaathi", "thaai", "thee", "treatu", "hukum"]):
        return "Anirudh Hits"
    if any(k in combined for k in ["chithra", "soul", "verasa", "unakaga", "unakku", "zara", "kanmani", "melody"]):
        return "Melody"
    if any(k in combined for k in ["verithanam", "vaada", "uchimandai", "spark", "villain", "energy", "beat", "rock"]):
        return "High Energy"
    if raw_genre and raw_genre.lower() not in ["soundtrack", "unknown", "other", "pop"]:
        return raw_genre
    return "Film Soundtrack"

def extract_audio_metadata(filepath: Path) -> Dict[str, Any]:
    """Extract metadata using mutagen for MP3, M4A, FLAC, and WAV files."""
    filename = filepath.name
    stem = filepath.stem
    meta = {
        "title": stem,
        "artist": "Various Artists",
        "album": "Original Soundtrack",
        "genre": "Soundtrack",
        "duration": 200, # default estimated duration in seconds
    }

    if not MUTAGEN_AVAILABLE:
        return meta

    try:
        audio = mutagen.File(str(filepath))
        if audio is None:
            return meta

        if hasattr(audio, "info") and audio.info and getattr(audio.info, "length", 0):
            meta["duration"] = round(audio.info.length)

        # ID3 tags (MP3 / WAV)
        if hasattr(audio, "tags") and audio.tags:
            tags = audio.tags
            
            # MP3 TIT2, TPE1, TALB, TCON
            if 'TIT2' in tags:
                meta["title"] = str(tags['TIT2'][0])
            elif 'title' in tags:
                meta["title"] = str(tags['title'][0])

            if 'TPE1' in tags:
                meta["artist"] = str(tags['TPE1'][0])
            elif 'artist' in tags:
                meta["artist"] = str(tags['artist'][0])

            if 'TALB' in tags:
                meta["album"] = str(tags['TALB'][0])
            elif 'album' in tags:
                meta["album"] = str(tags['album'][0])

            raw_g = ""
            if 'TCON' in tags:
                raw_g = str(tags['TCON'][0])
            elif 'genre' in tags:
                raw_g = str(tags['genre'][0])

            meta["title"] = clean_watermark(meta["title"]) or stem
            meta["artist"] = clean_watermark(meta["artist"]) or "Various Artists"
            meta["album"] = clean_watermark(meta["album"]) or "Original Soundtrack"
            meta["genre"] = derive_genre(meta["title"], meta["artist"], meta["album"], clean_watermark(raw_g))

        # MP4 / M4A metadata
        elif isinstance(audio, MP4):
            tags = audio.tags or {}
            meta["title"] = clean_watermark(tags.get('\xa9nam', [stem])[0]) or stem
            meta["artist"] = clean_watermark(tags.get('\xa9ART', ['Various Artists'])[0]) or "Various Artists"
            meta["album"] = clean_watermark(tags.get('\xa9alb', ['Original Soundtrack'])[0]) or "Original Soundtrack"
            raw_g = tags.get('\xa9gen', ['Soundtrack'])[0]
            meta["genre"] = derive_genre(meta["title"], meta["artist"], meta["album"], clean_watermark(raw_g))

    except Exception as e:
        print(f"Error reading metadata for {filename}: {e}")

    return meta

def scan_library() -> List[Dict[str, Any]]:
    """Scan SONGS_DIR for audio files and extract rich metadata."""
    scanned_tracks: List[Dict[str, Any]] = []
    seen_keys = set()
    track_id = 1

    if not SONGS_DIR.exists():
        return scanned_tracks

    audio_files = sorted(
        [f for f in os.listdir(SONGS_DIR) if f.lower().endswith(('.mp3', '.m4a', '.wav', '.ogg', '.flac'))]
    )

    for filename in audio_files:
        filepath = SONGS_DIR / filename
        meta = extract_audio_metadata(filepath)

        title = meta["title"]
        artist = meta["artist"]
        album = meta["album"]
        genre = meta["genre"]
        duration = meta["duration"]

        # Deduplication check by title and artist, fallback to filename if default
        dedup_key = (title.lower().strip(), artist.lower().strip(), filename.lower())
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        scanned_tracks.append({
            "id": track_id,
            "title": title,
            "artist": artist,
            "album": album,
            "duration": duration,
            "genre": genre,
            "file": filename,
            "audio_url": f"/api/tracks/{track_id}/stream",
            "direct_url": f"/songs/{quote(filename)}",
            "cover": f"/api/tracks/{track_id}/cover"
        })
        track_id += 1

    # Fallback to rich demo tracks if folder has no audio files
    if not scanned_tracks:
        scanned_tracks = [
            dict(id=1, title="Sunset Horizon", artist="Nova Waves", album="Horizons", duration=245, genre="Electronic",
                 cover="https://picsum.photos/seed/track1/400/400",
                 audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                 direct_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"),
            dict(id=2, title="Midnight Rain", artist="Lo-Fi Bloom", album="Slow Mornings", duration=198, genre="Melody",
                 cover="https://picsum.photos/seed/track2/400/400",
                 audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                 direct_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"),
            dict(id=3, title="Neon City Drive", artist="Nova Waves", album="Horizons", duration=212, genre="High Energy",
                 cover="https://picsum.photos/seed/track3/400/400",
                 audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                 direct_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"),
        ]

    return scanned_tracks

# Initialize library cache
TRACKS = scan_library()

# In-memory user state
FAVORITES: set[int] = {1, 2}

PLAYLISTS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Heavy Rotation",
        "description": "Most played favorites & trending tracks",
        "track_ids": [t["id"] for t in TRACKS[:8]]
    },
    {
        "id": 2,
        "name": "A.R. Rahman Classics",
        "description": "Timeless musical genius of Mozart of Madras",
        "track_ids": [t["id"] for t in TRACKS if "Rahman" in t.get("genre", "") or "Rahman" in t.get("artist", "")]
    },
    {
        "id": 3,
        "name": "High Energy & Mass",
        "description": "Workout, driving, and energetic anthems",
        "track_ids": [t["id"] for t in TRACKS if t.get("genre") == "High Energy"]
    },
]

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PlaylistTrackAdd(BaseModel):
    track_id: int

def generate_svg_cover(title: str, artist: str) -> str:
    """Generate a modern procedural gradient SVG album cover."""
    colors = [
        ("#6366f1", "#a855f7"),
        ("#ec4899", "#8b5cf6"),
        ("#06b6d4", "#3b82f6"),
        ("#f59e0b", "#ef4444"),
        ("#10b981", "#06b6d4"),
        ("#8b5cf6", "#ec4899"),
    ]
    hash_val = sum(ord(c) for c in title)
    c1, c2 = colors[hash_val % len(colors)]
    first_letter = (title[0] if title else "M").upper()

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="{c1}"/>
          <stop offset="100%" stop-color="{c2}"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
      <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <circle cx="200" cy="200" r="32" fill="rgba(0,0,0,0.35)"/>
      <text x="50%" y="54%" font-size="72" font-weight="bold" fill="rgba(255,255,255,0.95)"
            text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" filter="url(#glow)">{first_letter}</text>
    </svg>"""

@app.get("/api/tracks")
def list_tracks(
    genre: Optional[str] = None,
    search: Optional[str] = None,
    playlist_id: Optional[int] = None
):
    results = TRACKS
    
    if playlist_id:
        playlist = next((p for p in PLAYLISTS if p["id"] == playlist_id), None)
        if playlist:
            pid_set = set(playlist["track_ids"])
            results = [t for t in results if t["id"] in pid_set]
        else:
            return []

    if genre and genre != "All":
        results = [t for t in results if t.get("genre") == genre]

    if search:
        s = search.lower().strip()
        results = [
            t for t in results
            if s in t["title"].lower() or s in t["artist"].lower() or s in t.get("album", "").lower()
        ]

    return [{**t, "is_favorite": t["id"] in FAVORITES} for t in results]

@app.get("/api/tracks/{track_id}")
def get_track(track_id: int):
    for t in TRACKS:
        if t["id"] == track_id:
            return {**t, "is_favorite": t["id"] in FAVORITES}
    raise HTTPException(status_code=404, detail="Track not found")

@app.get("/api/tracks/{track_id}/stream")
def stream_track(track_id: int):
    """Direct streaming endpoint for audio tracks with HTTP 206 seek support."""
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    filename = track.get("file")
    if filename:
        filepath = SONGS_DIR / filename
        if filepath.exists():
            mime_map = {
                '.mp3': 'audio/mpeg',
                '.m4a': 'audio/mp4',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.flac': 'audio/flac'
            }
            media_type = mime_map.get(filepath.suffix.lower(), 'audio/mpeg')
            return FileResponse(
                path=str(filepath),
                media_type=media_type,
                filename=filename
            )

    if track.get("audio_url", "").startswith("http"):
        return RedirectResponse(url=track["audio_url"])

    raise HTTPException(status_code=404, detail="Audio file not found on disk")

@app.get("/api/tracks/{track_id}/cover")
def get_track_cover(track_id: int):
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    filename = track.get("file")
    if filename and MUTAGEN_AVAILABLE:
        filepath = SONGS_DIR / filename
        if filepath.exists():
            try:
                audio = mutagen.File(str(filepath))
                if audio is not None and hasattr(audio, "tags") and audio.tags:
                    # MP3 APIC
                    for key, tag in audio.tags.items():
                        if key.startswith("APIC"):
                            mime = tag.mime or "image/jpeg"
                            return Response(content=tag.data, media_type=mime)

                    # MP4 covr
                    if isinstance(audio, MP4) and 'covr' in audio.tags:
                        covers = audio.tags['covr']
                        if covers:
                            return Response(content=bytes(covers[0]), media_type="image/jpeg")

            except Exception as e:
                print(f"Error reading APIC cover: {e}")

    return Response(
        content=generate_svg_cover(track["title"], track["artist"]),
        media_type="image/svg+xml"
    )

@app.get("/api/genres")
def list_genres():
    genres = {t["genre"] for t in TRACKS if t.get("genre")}
    return sorted(list(genres))

@app.get("/api/playlists")
def list_playlists():
    enriched = []
    for p in PLAYLISTS:
        count = len(p["track_ids"])
        first_track = next((t for t in TRACKS if t["id"] in p["track_ids"]), None)
        cover_url = first_track["cover"] if first_track else None
        enriched.append({
            **p,
            "track_count": count,
            "cover": cover_url
        })
    return enriched

@app.post("/api/playlists")
def create_playlist(payload: PlaylistCreate):
    new_id = max([p["id"] for p in PLAYLISTS], default=0) + 1
    new_playlist = {
        "id": new_id,
        "name": payload.name,
        "description": payload.description or "",
        "track_ids": []
    }
    PLAYLISTS.append(new_playlist)
    return new_playlist

@app.put("/api/playlists/{playlist_id}")
def update_playlist(playlist_id: int, payload: PlaylistUpdate):
    playlist = next((p for p in PLAYLISTS if p["id"] == playlist_id), None)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if payload.name is not None:
        playlist["name"] = payload.name
    if payload.description is not None:
        playlist["description"] = payload.description
    return playlist

@app.delete("/api/playlists/{playlist_id}")
def delete_playlist(playlist_id: int):
    global PLAYLISTS
    playlist = next((p for p in PLAYLISTS if p["id"] == playlist_id), None)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    PLAYLISTS = [p for p in PLAYLISTS if p["id"] != playlist_id]
    return {"message": "Playlist deleted successfully", "id": playlist_id}

@app.post("/api/playlists/{playlist_id}/tracks")
def add_track_to_playlist(playlist_id: int, payload: PlaylistTrackAdd):
    playlist = next((p for p in PLAYLISTS if p["id"] == playlist_id), None)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if payload.track_id not in playlist["track_ids"]:
        playlist["track_ids"].append(payload.track_id)
    return playlist

@app.delete("/api/playlists/{playlist_id}/tracks/{track_id}")
def remove_track_from_playlist(playlist_id: int, track_id: int):
    playlist = next((p for p in PLAYLISTS if p["id"] == playlist_id), None)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if track_id in playlist["track_ids"]:
        playlist["track_ids"].remove(track_id)
    return playlist

@app.get("/api/favorites")
def list_favorites():
    return sorted(list(FAVORITES))

@app.post("/api/favorites/{track_id}")
def toggle_favorite(track_id: int):
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    if track_id in FAVORITES:
        FAVORITES.remove(track_id)
        is_favorite = False
    else:
        FAVORITES.add(track_id)
        is_favorite = True
    return {"track_id": track_id, "is_favorite": is_favorite, "favorites": sorted(list(FAVORITES))}

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "spvm3-player-api",
        "version": "2.0.0",
        "total_tracks": len(TRACKS),
        "total_playlists": len(PLAYLISTS)
    }
