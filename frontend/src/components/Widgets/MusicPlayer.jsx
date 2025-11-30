import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Music } from 'lucide-react'
import toast from 'react-hot-toast'

// Predefined focus music playlists (YouTube/Spotify links or local audio)
const FOCUS_PLAYLISTS = [
  {
    id: 'lofi',
    name: 'Lofi Hip Hop',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl
    type: 'youtube'
  },
  {
    id: 'classical',
    name: 'Classical Focus',
    url: 'https://www.youtube.com/watch?v=4Tr0otuiQuU', // Classical Music
    type: 'youtube'
  },
  {
    id: 'nature',
    name: 'Nature Sounds',
    url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4', // Rain Sounds
    type: 'youtube'
  },
  {
    id: 'binaural',
    name: 'Binaural Beats',
    url: 'https://www.youtube.com/watch?v=UfcAVejslrU', // Focus Music
    type: 'youtube'
  }
]

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const audioRef = useRef(null)
  const iframeRef = useRef(null)
  
  const currentTrack = currentTrackIndex >= 0 ? FOCUS_PLAYLISTS[currentTrackIndex] : null

  // Handle YouTube embed
  useEffect(() => {
    if (currentTrack && currentTrack.type === 'youtube' && iframeRef.current) {
      // YouTube iframe API would be needed for full control
      // For now, we'll use a simple embed
    }
  }, [currentTrack])

  const handlePlay = () => {
    if (!currentTrack) {
      toast.error('Please select a track first')
      return
    }

    if (currentTrack.type === 'youtube') {
      // Toggle YouTube embed play/pause by updating iframe src
      setIsPlaying(!isPlaying)
      if (iframeRef.current) {
        const videoId = currentTrack.url.split('v=')[1]?.split('&')[0]
        if (videoId) {
          iframeRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=${!isPlaying ? 1 : 0}&controls=1&modestbranding=1`
        }
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSelectTrack = (index) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
    toast.success(`Selected ${FOCUS_PLAYLISTS[index].name}`)
    setShowPlaylist(false)
  }
  
  const handleNext = () => {
    if (currentTrackIndex < 0) {
      handleSelectTrack(0)
      return
    }
    const nextIndex = (currentTrackIndex + 1) % FOCUS_PLAYLISTS.length
    handleSelectTrack(nextIndex)
  }
  
  const handlePrevious = () => {
    if (currentTrackIndex < 0) {
      handleSelectTrack(FOCUS_PLAYLISTS.length - 1)
      return
    }
    const prevIndex = (currentTrackIndex - 1 + FOCUS_PLAYLISTS.length) % FOCUS_PLAYLISTS.length
    handleSelectTrack(prevIndex)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold">Focus Music</h3>
          </div>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="text-white/60 hover:text-white text-sm"
          >
            {showPlaylist ? 'Hide' : 'Browse'}
          </button>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="p-4 border-b border-white/10 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {FOCUS_PLAYLISTS.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  currentTrackIndex === index
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span className="text-sm">{track.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Controls */}
      <div className="p-4 space-y-4">
        {/* Current Track Info */}
        {currentTrack ? (
          <div className="text-center">
            <p className="text-white font-medium text-sm">{currentTrack.name}</p>
            {currentTrack.type === 'youtube' && (
              <p className="text-white/60 text-xs mt-1">
                Click to open in YouTube
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white/60 text-sm">No track selected</p>
          </div>
        )}

        {/* YouTube Embed (if YouTube track) */}
        {currentTrack?.type === 'youtube' && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              key={currentTrack.id} // Force re-render on track change
              src={`https://www.youtube.com/embed/${currentTrack.url.split('v=')[1]?.split('&')[0]}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&enablejsapi=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              title={currentTrack.name}
            />
          </div>
        )}

        {/* Audio Player (for local files) */}
        {currentTrack?.type === 'audio' && (
          <audio
            ref={audioRef}
            src={currentTrack.url}
            volume={volume}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            title="Previous"
            disabled={FOCUS_PLAYLISTS.length === 0}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlay}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition text-white disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={!currentTrack}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            title="Next"
            disabled={FOCUS_PLAYLISTS.length === 0}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        {currentTrack?.type === 'audio' && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white/60 text-xs w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}

        {/* Quick Action for YouTube */}
        {currentTrack?.type === 'youtube' && (
          <button
            onClick={() => window.open(currentTrack.url, '_blank')}
            className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium"
          >
            Open in YouTube
          </button>
        )}
      </div>
    </div>
  )
}

