import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase' 
import { Upload, Music, Image as ImageIcon, Loader2, Trash2, CheckCircle, Play, Pause, RefreshCw, LogOut, Plus, Tag, AlertCircle, Edit2, X } from 'lucide-react'

export default function CMS() {
  // Auth State
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  // Data State
  const [tracks, setTracks] = useState([])
  const [genres, setGenres] = useState([]) 
  const [loadingData, setLoadingData] = useState(false)
  
  // Upload/Edit State
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null) // <--- Tracks if we are editing
  
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // Genre Creation State
  const [newGenreName, setNewGenreName] = useState('')

  // Audio Preview
  const [playingUrl, setPlayingUrl] = useState(null)
  const audioRef = useRef(null)

  // --- AUTH LOGIC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) fetchData()
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchData()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoadingData(true)
    
    const { data: tracksData } = await supabase
      .from('cms_tracks')
      .select('*, genres(name)')
      .order('created_at', { ascending: false })
    
    const { data: genresData } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true })

    setTracks(tracksData || [])
    setGenres(genresData || [])
    setLoadingData(false)
  }

  // --- GENRE ACTIONS ---
  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return
    const { error } = await supabase.from('genres').insert({ name: newGenreName, is_active: true })
    if (error) return alert(error.message)
    
    setNewGenreName('')
    fetchData()
  }

  const handleDeleteGenre = async (id) => {
    if (!confirm("Delete this genre? Tracks using it might lose their tag.")) return
    const { error } = await supabase.from('genres').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchData()
  }

  // --- EDIT MODE LOGIC ---
  const startEditing = (track) => {
    setEditingId(track.id)
    setTitle(track.title)
    setArtist(track.artist)
    setSelectedGenre(track.genre_id || '')
    setAudioFile(null) // Reset files (we don't re-upload unless user picks new ones)
    setImageFile(null)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setTitle('')
    setArtist('')
    setSelectedGenre('')
    setAudioFile(null)
    setImageFile(null)
  }

  // --- TRACK UPLOAD / UPDATE ---
  const handleSave = async (e) => {
    e.preventDefault()
    if (!title || !artist) return alert("Title and Artist are required.")

    setUploading(true)
    try {
      let audioUrl = null
      let imageUrl = null

      // 1. Upload NEW Audio if selected
      if (audioFile) {
          const audioName = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
          const { error: audioErr } = await supabase.storage.from('music-cms').upload(audioName, audioFile)
          if (audioErr) throw audioErr
          audioUrl = supabase.storage.from('music-cms').getPublicUrl(audioName).data.publicUrl
      }

      // 2. Upload NEW Image if selected
      if (imageFile) {
        const imageName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const { error: imageErr } = await supabase.storage.from('music-cms').upload(imageName, imageFile)
        if (imageErr) throw imageErr
        imageUrl = supabase.storage.from('music-cms').getPublicUrl(imageName).data.publicUrl
      }

      // 3. DATABASE ACTION
      if (editingId) {
        // --- UPDATE MODE ---
        const updates = {
            title,
            artist,
            genre_id: selectedGenre || null,
        }
        // Only update file paths if a NEW file was uploaded
        if (audioUrl) updates.audio_path = audioUrl
        if (imageUrl) updates.thumbnail = imageUrl

        const { error } = await supabase.from('cms_tracks').update(updates).eq('id', editingId)
        if (error) throw error
        alert("Track Updated Successfully!")

      } else {
        // --- CREATE MODE ---
        const { error } = await supabase.from('cms_tracks').insert({
            title,
            artist,
            audio_path: audioUrl, // Can be null
            thumbnail: imageUrl,
            genre_id: selectedGenre || null,
            is_active: true
        })
        if (error) throw error
        alert("Track Published!")
      }

      // Reset
      cancelEditing()
      fetchData()

    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteTrack = async (id) => {
    if (!confirm("Delete this track?")) return
    const { error } = await supabase.from('cms_tracks').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchData()
  }

  const togglePreview = (url) => {
    if (!url) return
    if (playingUrl === url) {
      audioRef.current.pause()
      setPlayingUrl(null)
    } else {
      audioRef.current.src = url
      audioRef.current.play()
      setPlayingUrl(url)
    }
  }

  // --- LOGIN SCREEN ---
  if (!session) {
    if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 space-y-6">
          <h1 className="text-2xl font-bold text-white text-center">CMS Login</h1>
          <div className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
            <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition">Sign In</button>
          </div>
        </form>
      </div>
    )
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 md:p-12">
      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Creator Studio</h1>
          <p className="text-zinc-500">Manage Home Page Content</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition"><RefreshCw size={20} /></button>
          <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: FORM --- */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* 1. UPLOAD / EDIT FORM */}
            <div className={`p-6 rounded-3xl border transition-colors ${editingId ? 'bg-zinc-900 border-yellow-500/50' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {editingId ? <><Edit2 size={20} className="text-yellow-400" /> Edit Track</> : <><Upload size={20} className="text-purple-400" /> New Release</>}
                    </h2>
                    {editingId && (
                        <button onClick={cancelEditing} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">
                            <X size={12} /> Cancel
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase">Track Info</label>
                        <input className="w-full mt-2 bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                        <input className="w-full mt-2 bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none" placeholder="Artist" value={artist} onChange={e => setArtist(e.target.value)} />
                        
                        <select 
                            value={selectedGenre}
                            onChange={e => setSelectedGenre(e.target.value)}
                            className="w-full mt-2 bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none appearance-none"
                        >
                            <option value="">Select Genre...</option>
                            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                            {editingId ? "Update Files (Optional)" : "Media Files"}
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <label className={`cursor-pointer border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition ${audioFile ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                                <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files[0])} />
                                <Music className={audioFile ? "text-green-400" : "text-zinc-500"} />
                                <span className="text-[10px] text-zinc-400 truncate w-full text-center">
                                    {audioFile ? "New Audio Selected" : (editingId ? "Keep Current Audio" : "No Audio")}
                                </span>
                            </label>
                            
                            <label className={`cursor-pointer border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition ${imageFile ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-700 hover:bg-zinc-800'}`}>
                                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
                                <ImageIcon className={imageFile ? "text-purple-400" : "text-zinc-500"} />
                                <span className="text-[10px] text-zinc-400 truncate w-full text-center">
                                    {imageFile ? "New Image Selected" : (editingId ? "Keep Current Image" : "No Cover")}
                                </span>
                            </label>
                        </div>
                    </div>

                    <button 
                        disabled={uploading} 
                        className={`w-full font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                    >
                        {uploading ? <Loader2 className="animate-spin" /> : (editingId ? <CheckCircle size={18} /> : <Plus size={18} />)}
                        {uploading ? (editingId ? 'Updating...' : 'Uploading...') : (editingId ? 'Update Track' : 'Publish Track')}
                    </button>
                </form>
            </div>

            {/* 2. GENRE MANAGER */}
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-pink-400" /> Genres
                </h2>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        value={newGenreName}
                        onChange={e => setNewGenreName(e.target.value)}
                        placeholder="New Genre..."
                        className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-pink-500 outline-none"
                    />
                    <button onClick={handleAddGenre} disabled={!newGenreName.trim()} className="p-2 bg-pink-600 hover:bg-pink-500 rounded-xl text-white disabled:opacity-50">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {genres.map(g => (
                        <div key={g.id} className="group flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-300 border border-zinc-700">
                            {g.name}
                            <button onClick={() => handleDeleteGenre(g.id)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {genres.length === 0 && <span className="text-zinc-600 text-sm italic">No genres yet.</span>}
                </div>
            </div>

        </div>

        {/* --- RIGHT COLUMN: TRACK LIST --- */}
        <div className="lg:col-span-8">
          <h2 className="text-xl font-bold mb-6 text-zinc-400">Live Tracks ({tracks.length})</h2>
          
          <div className="space-y-3">
            {loadingData && <p className="text-zinc-500">Loading...</p>}
            {!loadingData && tracks.length === 0 && <p className="text-zinc-600">No tracks found.</p>}
            
            {tracks.map(track => (
              <div key={track.id} className={`flex items-center gap-4 bg-zinc-900 p-3 rounded-xl border transition group ${editingId === track.id ? 'border-yellow-500' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <div className="relative w-12 h-12 shrink-0">
                  <img src={track.thumbnail || 'https://via.placeholder.com/150'} className="w-full h-full rounded-lg object-cover bg-black" />
                  
                  {track.audio_path ? (
                    <button onClick={() => togglePreview(track.audio_path)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        {playingUrl === track.audio_path ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                    </button>
                  ) : (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-not-allowed">
                       <AlertCircle size={16} className="text-red-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate text-sm">{track.title}</h4>
                  <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                </div>

                {track.genres && (
                    <span className="hidden sm:inline-block text-[10px] font-mono bg-black px-2 py-1 rounded text-zinc-400 border border-zinc-800">
                        {track.genres.name}
                    </span>
                )}

                <div className="flex gap-2">
                    {/* EDIT BUTTON */}
                    <button onClick={() => startEditing(track)} className="p-2 text-zinc-600 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition" title="Edit">
                        <Edit2 size={16} />
                    </button>
                    {/* DELETE BUTTON */}
                    <button onClick={() => handleDeleteTrack(track.id)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}