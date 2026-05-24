import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://yqfboyjcasddfvzjmdty.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZmJveWpjYXNkZGZ2emptZHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzE0OTYsImV4cCI6MjA5NTIwNzQ5Nn0.43BWjvFuiXmA9p1xd-qDN1IG9X8n-oGOn23ItGjU77k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

