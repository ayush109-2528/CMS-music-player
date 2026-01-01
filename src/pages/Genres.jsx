import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Palette } from 'lucide-react'
import axios from 'axios'
import { API_CONFIG } from '../config/api.js'

export default function Genres() {
  const [genres, setGenres] = useState([])
  const [form, setForm] = useState({ name: '', color: '#8b5cf6' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      const { data } = await axios.get(`${API_CONFIG.BASE_URL}/api/genres`)
      setGenres(data)
    } catch (error) {
      console.error('Genres error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) {
        await axios.put(`${API_CONFIG.BASE_URL}/api/genres/${editingId}`, form)
      } else {
        await axios.post(`${API_CONFIG.BASE_URL}/api/genres`, form)
      }
      setForm({ name: '', color: '#8b5cf6' })
      setEditingId(null)
      fetchGenres()
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving genre')
    } finally {
      setLoading(false)
    }
  }

  const editGenre = (genre) => {
    setForm({ name: genre.name, color: genre.color })
    setEditingId(genre.id)
  }

  const deleteGenre = async (id) => {
    if (confirm('Delete genre?')) {
      try {
        await axios.delete(`${API_CONFIG.BASE_URL}/api/genres/${id}`)
        fetchGenres()
      } catch (error) {
        alert('Delete failed')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Genres ({genres.length})
        </h1>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-white mb-3 font-semibold">Genre Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rock, Pop, Electronic..."
              className="w-full p-4 bg-white/20 rounded-2xl border border-white/30 text-white focus:outline-none focus:border-purple-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-white mb-3 font-semibold">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full h-14 p-1 rounded-2xl border-4 border-white/20 shadow-lg cursor-pointer"
            />
          </div>
          
          <div className="flex gap-3 lg:justify-end">
            <button
              type="button"
              onClick={() => {
                setForm({ name: '', color: '#8b5cf6' })
                setEditingId(null)
              }}
              className="px-8 py-4 bg-white/20 text-white rounded-2xl border border-white/30 hover:bg-white/30 transition-all flex-1 lg:flex-none"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-600 shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add Genre'}
            </button>
          </div>
        </form>
      </div>

      {/* Genres List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {genres.map(genre => (
          <div key={genre.id} className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl -rotate-12 opacity-50 group-hover:opacity-75 transition-all" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-2xl flex items-center justify-center" 
                   style={{ backgroundColor: genre.color }}>
                <span className="text-2xl font-bold text-white">🎵</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white text-center mb-4 truncate">
                {genre.name}
              </h3>
              
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all absolute bottom-6 left-6 right-6">
                <button
                  onClick={() => editGenre(genre)}
                  className="flex-1 p-3 bg-white/20 hover:bg-white/40 rounded-2xl border border-white/30 text-white transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => deleteGenre(genre.id)}
                  className="flex-1 p-3 bg-red-500/30 hover:bg-red-500/50 rounded-2xl border border-red-500/50 text-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
