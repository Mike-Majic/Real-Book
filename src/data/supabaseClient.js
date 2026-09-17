import { createClient } from '@supabase/supabase-js';

// Chiave "anon"/publishable: pensata per stare nel bundle pubblico che
// arriva al browser (chiunque può leggerla dagli strumenti sviluppatore).
// Non è un segreto: l'accesso reale ai dati è deciso dalle regole RLS del
// progetto Supabase, non dalla segretezza di questa chiave. La
// service_role key (quella sì da non esporre mai) non viene mai usata qui.
const SUPABASE_URL = 'https://bxcwwtydlaodntvilhik.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Y3d3dHlkbGFvZG50dmlsaGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTU5NzQsImV4cCI6MjEwNTE5MTk3NH0.XJwgOKIkcAwoMaQdaQQacTQ5wdokzQAEkkZ5H4Ba7iQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
