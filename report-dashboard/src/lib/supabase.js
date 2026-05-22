import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder'
)

export const isMockMode = () =>
  !process.env.REACT_APP_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL === 'https://placeholder.supabase.co'
