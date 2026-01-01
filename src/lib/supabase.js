import { createClient } from '@supabase/supabase-js'

// Load variables from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Safety check to prevent "Invalid URL" errors
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables! Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)