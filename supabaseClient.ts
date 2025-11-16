import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibtoklzpnhtaytfunoqq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidG9rbHpwbmh0YXl0ZnVub3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTE3MTgsImV4cCI6MjA3ODQ2NzcxOH0.orAaMLYnVb9icS0wT8JURvi71bV8UYuuP8-HCUF2KBg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
