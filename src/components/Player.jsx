import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../contexts/PlayerContext'
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

export default function Player() {
  const { state, actions } = usePlayer()
  const [time, setTime] = useState({ current: 0, duration: 0 })
  const progressRef = useRef(null)

  useEffect(() => {
    const audio = document.querySelector('audio')
    const tick = () => setTime({ 
      current: audio?.currentTime || 0, 
      duration: audio?.duration || 0 
    })
    
    audio?.addEventListener('timeupdate', tick)
    return () => audio?.removeEventListener('timeupdate', tick)
  }, [])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${ss.toString().padStart(2, '0')}`
  }

  const closePlayer = () => {
    const audio = document.querySelector('audio')
    audio?.pause()
    actions.clearQueue()
  }

  return (
    <motion.div 
      layout
      className="bg-gradient-to-r from-black/95 via-gray-900/90 to-black/95 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl p-6 max-w-4xl mx-auto"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      {/* Track Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-2xl animate-pulse">♪</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-xl truncate">{state.currentTrack?.title}</h3>
            <p className="text-white/60 text-sm truncate">{state.currentTrack?.artist}</p>
          </div>
        </div>
        
        <button 
          onClick={closePlayer}
          className="p-3 bg-red-500/80 hover:bg-red-600 rounded-2xl text-white shadow-lg hover:shadow-xl ml-4 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-mono text-white/60 mb-4">
          <span>{formatTime(time.current)}</span>
          <span>{formatTime(time.duration)}</span>
        </div>
        <input
          ref={progressRef}
          type="range"
          min="0" max="1" step="any"
          value={time.duration ? time.current / time.duration : 0}
          onChange={e => {
            const audio = document.querySelector('audio')
            if (audio?.duration) {
              audio.currentTime = parseFloat(e.target.value) * audio.duration
            }
          }}
          className="w-full h-2 bg-white/20 rounded-full accent-purple-500 hover:accent-purple-400 shadow-inner"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        {/* Volume */}
        <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <button onClick={actions.toggleMute} className="p-2 hover:bg-white/30 rounded-xl">
            {state.muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-6">
          <button onClick={actions.previousTrack} className="p-3 hover:bg-white/20 rounded-2xl">
            <SkipBack className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={actions.togglePlay}
            className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:shadow-3xl hover:scale-[1.1] transition-all border-4 border-white/20"
          >
            {state.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
          </button>
          
          <button onClick={actions.nextTrack} className="p-3 hover:bg-white/20 rounded-2xl">
            <SkipForward className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
