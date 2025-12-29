import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AuthPage({ 
  signInWithPassword, 
  signUp, 
  signInWithOtp, 
  verifyOtp, 
  resetPassword,
  onSuccess 
}) {
  
  // Auth modes: 'signin' | 'signup' | 'otp' | 'verify' | 'forgot'
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const codeRefs = useRef([])

  // --- HANDLERS ---

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else onSuccess()
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!email || !password || password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else setMode('verify')
  }

  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithOtp(email)
    setLoading(false)
    if (error) setError(error.message)
    else setMode('verify')
  }

  const verifyCode = async () => {
    const token = code.join('')
    if (token.length !== 6) return
    setLoading(true)
    setError('')
    const { error } = await verifyOtp(email, token)
    setLoading(false)
    if (error) setError(error.message)
    else onSuccess()
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error.message)
    else setError('Password reset email sent! Check your inbox.')
  }

  // OTP Input Logic
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) codeRefs.current[index + 1]?.focus()
    if (index === 5 && value.length === 1) verifyCode()
  }

  const handleBackspace = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30">
      <div className="w-full max-w-md">
        
        {/* Header Logo Area */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-violet-900/20 mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Creator Studio</h1>
          <p className="text-zinc-500">Manage your music empire</p>
        </div>

        {/* Tab Switcher */}
        {['signin', 'signup'].includes(mode) && (
          <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-8 border border-white/5">
            <button
              onClick={() => { setMode('signin'); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signin' 
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signup' 
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* --- SIGN IN --- */}
          {mode === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/30 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
            >
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-600"
                      placeholder="producer@studio.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-violet-400 hover:text-violet-300">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Access Studio'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <button onClick={sendOtp} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Or sign in with <span className="text-violet-400">Magic Link</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* --- SIGN UP --- */}
          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/30 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
            >
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500/50"
                    placeholder="Email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500/50"
                    placeholder="Create Password"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500/50"
                    placeholder="Confirm Password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Create Account'}
                </button>
              </form>
            </motion.div>
          )}

          {/* --- VERIFY OTP --- */}
          {mode === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900/30 border border-white/10 p-8 rounded-3xl text-center"
            >
              <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-zinc-500 mb-8">We sent a verification code to <br/><span className="text-white font-medium">{email}</span></p>
              
              <div className="flex gap-2 justify-center mb-8">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleBackspace(i, e)}
                    className="w-12 h-14 bg-zinc-950 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setMode('signin')} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors">Back</button>
                <button onClick={verifyCode} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/20">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Verify'}
                </button>
              </div>
            </motion.div>
          )}

          {/* --- FORGOT PASSWORD --- */}
          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-zinc-900/30 border border-white/10 p-8 rounded-3xl"
            >
              <h2 className="text-xl font-bold mb-6">Reset Password</h2>
              <p className="text-zinc-500 mb-6 text-sm">Enter your email and we'll send you a recovery link.</p>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 px-4 mb-4 focus:outline-none focus:border-violet-500/50"
                placeholder="Email address"
              />
              
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold mb-4"
              >
                {loading ? 'Sending...' : 'Send Link'}
              </button>
              
              <button onClick={() => setMode('signin')} className="w-full text-sm text-zinc-500 hover:text-white">Back to Login</button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Global Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                error.includes('sent') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {error.includes('sent') ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {error}
          </motion.div>
        )}

      </div>
    </div>
  )
}