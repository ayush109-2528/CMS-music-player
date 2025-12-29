import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import { usePlayer } from '../contexts/PlayerContext'
import AuthPage from './AuthPage'
import { 
  Upload, Music, Image as ImageIcon, Plus, Trash2, 
  Play, Disc, Loader2, Search, Mic2, Layers, LogOut 
} from 'lucide-react'

export default function CMS() {
  // --- AUTH STATE ---
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // --- CMS STATE ---
  const [genres, setGenres] = useState([])
  const [tracks, setTracks] = useState([])
  const [form, setForm] = useState({
    title: '',
    artist: '',
    thumbnail: null,
    audio: null,
    genre_id: ''
  })
  
  const [thumbPreview, setThumbPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [newGenre, setNewGenre] = useState('')
  const { actions } = usePlayer()

  // 1. CHECK AUTH ON MOUNT
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) loadData() // Only load data if logged in
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadData()
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      const { data: genreData } = await supabase
        .from('genres')
        .select('*')
        .eq('is_active', true)
        .order('name')
      setGenres(genreData || [])

      const { data: trackData } = await supabase
        .from('cms_tracks')
        .select(`*, genres(name)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setTracks(trackData || [])
    } catch (error) {
      console.error('Load error:', error)
    }
  }

  // --- AUTH ACTIONS (Passed to AuthPage) ---
  const authActions = {
    signInWithPassword: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signInWithOtp: (email) => supabase.auth.signInWithOtp({ email }),
    verifyOtp: (email, token) => supabase.auth.verifyOtp({ email, token, type: 'magiclink' }), // or 'signup' depending on context
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
    onSuccess: () => {} // handled by onAuthStateChange
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setGenres([])
    setTracks([])
  }

  // --- CMS ACTIONS ---
  const addGenre = async () => {
    if (!newGenre.trim()) return
    const { error } = await supabase.from('genres').insert({
      name: newGenre.trim(),
      is_active: true
    }) // RLS policy will handle user permission
    if (!error) {
      setNewGenre('')
      loadData()
    }
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'thumbnail') {
      setForm({ ...form, thumbnail: file })
      setThumbPreview(URL.createObjectURL(file))
    } else {
      setForm({ ...form, audio: file })
    }
  }

  const uploadTrack = async () => {
    if (!form.title.trim() || !form.audio) {
      alert('Title and audio file are required!')
      return
    }

    setUploading(true)
    try {
      const timeStamp = Date.now()
      const audioExt = form.audio.name.split('.').pop()
      const audioPath = `audio/${timeStamp}_${Math.random().toString(36).substr(2, 5)}.${audioExt}`
      
      let thumbPath = null
      if (form.thumbnail) {
        const thumbExt = form.thumbnail.name.split('.').pop()
        thumbPath = `thumbnails/${timeStamp}_${Math.random().toString(36).substr(2, 5)}.${thumbExt}`
        await supabase.storage.from('music-cms').upload(thumbPath, form.thumbnail)
      }

      await supabase.storage.from('music-cms').upload(audioPath, form.audio)

      await supabase.from('cms_tracks').insert({
        title: form.title.trim(),
        artist: form.artist.trim() || 'Unknown Artist',
        thumbnail: thumbPath || null,
        audio_path: audioPath,
        genre_id: form.genre_id || null,
        duration: 180 
      })

      setForm({ title: '', artist: '', thumbnail: null, audio: null, genre_id: '' })
      setThumbPreview(null)
      loadData()
      alert('✅ Track Published Successfully')
    } catch (error) {
      console.error(error)
      alert('❌ Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const deleteTrack = async (id) => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      await supabase.from('cms_tracks').delete().eq('id', id)
      loadData()
    }
  }

  const playTrack = async (track) => {
    const { data } = supabase.storage.from('music-cms').getPublicUrl(track.audio_path)
    actions.playTrack({ 
      id: track.id,
      title: track.title, 
      artist: track.artist, 
      streamUrl: data.publicUrl,
      thumbnail: track.thumbnail,
      duration: track.duration || 180
    })
  }

  // --- CONDITIONAL RENDERING ---

  // 1. Loading Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    )
  }

  // 2. Auth Page (If not logged in)
  if (!session) {
    return <AuthPage {...authActions} />
  }

  // 3. Main CMS (If logged in)
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans selection:bg-violet-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                Creator Studio
              </span>
            </h1>
            <p className="text-zinc-400 text-lg flex items-center gap-2">
              <Layers className="w-5 h-5" /> Manage your sonic universe
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Stats */}
            <div className="hidden md:flex gap-4">
              <div className="px-6 py-3 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{tracks.length}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tracks</span>
              </div>
              <div className="px-6 py-3 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{genres.length}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Genres</span>
              </div>
            </div>
            
            {/* LOGOUT BUTTON */}
            <button 
              onClick={handleSignOut}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all flex items-center gap-2 font-semibold h-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: UPLOAD & GENRES (4 cols) */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* 📤 UPLOAD CARD */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Upload className="w-32 h-32 rotate-12" />
              </div>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 relative z-10">
                <Disc className="w-6 h-6 text-violet-400" /> New Release
              </h2>

              <div className="space-y-5 relative z-10">
                {/* Text Inputs */}
                <div className="space-y-4">
                  <input
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="Track Title"
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
                  />
                  <div className="flex gap-3">
                    <input
                      value={form.artist}
                      onChange={e => setForm({...form, artist: e.target.value})}
                      placeholder="Artist"
                      className="w-1/2 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-600"
                    />
                    <select
                      value={form.genre_id}
                      onChange={e => setForm({...form, genre_id: e.target.value})}
                      className="w-1/2 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-all text-zinc-400"
                    >
                      <option value="">Select Genre</option>
                      {genres.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom File Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <label className="cursor-pointer group relative aspect-square rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 bg-zinc-950/30 flex flex-col items-center justify-center transition-all overflow-hidden">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'thumbnail')} />
                    {thumbPreview ? (
                      <>
                        <img src={thumbPreview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="z-10 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-violet-400 mb-2 transition-colors" />
                        <span className="text-xs text-zinc-500 font-medium">Cover Art</span>
                      </>
                    )}
                  </label>

                  {/* Audio Upload */}
                  <label className={`cursor-pointer group relative aspect-square rounded-2xl border-2 border-dashed ${form.audio ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-700 hover:border-violet-500/50 bg-zinc-950/30'} flex flex-col items-center justify-center transition-all`}>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e, 'audio')} />
                    <Music className={`w-8 h-8 mb-2 transition-colors ${form.audio ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-violet-400'}`} />
                    <span className={`text-xs font-medium ${form.audio ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {form.audio ? 'Audio Set' : 'Audio File'}
                    </span>
                    {form.audio && <span className="text-[10px] text-emerald-500/70 mt-1 max-w-[80%] truncate">{form.audio.name}</span>}
                  </label>
                </div>

                <button
                  onClick={uploadTrack}
                  disabled={!form.title.trim() || !form.audio || uploading}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                >
                  {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                  {uploading ? 'Processing...' : 'Publish Track'}
                </button>
              </div>
            </div>

            {/* 🏷️ GENRES CARD */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-fuchsia-400" /> Genres
                </h2>
              </div>
              
              <div className="flex gap-2 mb-6">
                <input
                  value={newGenre}
                  onChange={e => setNewGenre(e.target.value)}
                  placeholder="New Genre..."
                  className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-fuchsia-500/50"
                />
                <button 
                  onClick={addGenre}
                  disabled={!newGenre.trim()}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <span key={genre.id} className="px-3 py-1.5 bg-zinc-800/50 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-default">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TRACK LIBRARY (8 cols) */}
          <div className="xl:col-span-8">
            <div className="bg-zinc-900/20 backdrop-blur-md rounded-3xl p-8 border border-white/5 min-h-[800px]">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Library</h2>
                  <p className="text-zinc-500 text-sm">Your uploaded master tracks</p>
                </div>
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input placeholder="Search library..." className="bg-zinc-950/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500/50 w-64" />
                </div>
              </div>

              {tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                  <Music className="w-16 h-16 mb-4 opacity-20" />
                  <p>No tracks in the vault yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tracks.map(track => {
                    const { data: thumbUrl } = supabase.storage
                      .from('music-cms')
                      .getPublicUrl(track.thumbnail || 'thumbnails/default.jpg')
                    
                    return (
                      <div
                        key={track.id}
                        className="group bg-zinc-950 border border-white/5 hover:border-violet-500/30 rounded-2xl p-3 hover:shadow-2xl hover:shadow-violet-900/10 transition-all duration-300 flex gap-4 md:block"
                        onClick={() => playTrack(track)}
                      >
                        {/* Artwork */}
                        <div className="relative aspect-square w-24 md:w-full rounded-xl overflow-hidden bg-zinc-900 md:mb-4 shrink-0">
                          <img 
                            src={thumbUrl.publicUrl} 
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                              <Play className="w-5 h-5 text-black fill-current ml-1" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <h3 className="font-bold text-white text-lg truncate group-hover:text-violet-400 transition-colors">{track.title}</h3>
                          <p className="text-zinc-500 text-sm truncate mb-2">{track.artist}</p>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md">
                              {track.genres?.name || 'Unsorted'}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                deleteTrack(track.id)
                              }}
                              className="text-zinc-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}