import { createContext, useContext, useRef, useState, useEffect } from 'react'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const audioRef = useRef()
  const [state, setState] = useState({
    currentTrack: null,
    isPlaying: false,
    volume: 0.8,
    muted: false,
    queue: []
  })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = state.volume
    audio.muted = state.muted
  }, [state.volume, state.muted])

  const actions = {
    playTrack: (track) => {
      const audio = audioRef.current
      audio.src = track.streamUrl
      audio.play()
      setState(s => ({ ...s, currentTrack: track, isPlaying: true }))
    },
    togglePlay: () => {
      const audio = audioRef.current
      if (state.isPlaying) audio.pause()
      else audio.play()
      setState(s => ({ ...s, isPlaying: !s.isPlaying }))
    },
    clearQueue: () => {
      const audio = audioRef.current
      audio.pause()
      audio.src = ''
      setState({ currentTrack: null, isPlaying: false, volume: 0.8, muted: false, queue: [] })
    },
    setVolume: (vol) => setState(s => ({ ...s, volume: vol })),
    toggleMute: () => setState(s => ({ ...s, muted: !s.muted }))
  }

  return (
    <PlayerContext.Provider value={{ state, actions }}>
      <audio ref={audioRef} className="hidden" />
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
