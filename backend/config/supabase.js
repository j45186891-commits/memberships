const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://tdqwgjbkkldvioxzator.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDgwOTIsImV4cCI6MjA3NTYyNDA5Mn0.R9-OWeBeRwYSduQ7n8tLaqEfsCtE6Hdarq3hZBjBbKQ';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0ODA5MiwiZXhwIjoyMDc1NjI0MDkyfQ.CETODpNxEJ1tRouJ0RGm5k9D1vgThlywHmddbSa8_-c';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseUrl,
  supabaseAnonKey
};