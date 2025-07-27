// Migration runner using existing environment variables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Starting Community Tools migration...');
  
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250127181500_add_community_tools.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded');
    console.log('🔍 Checking existing tables...');
    
    // Check if community tables already exist by trying to query them
    let tablesExist = false;
    try {
      const { error: toolsError } = await supabase
        .from('tools')
        .select('id')
        .limit(1);
      
      if (!toolsError) {
        tablesExist = true;
      }
    } catch (e) {
      // Tables don't exist, which is what we want
    }
    
    if (tablesExist) {
      console.log('⚠️  Community tools tables already exist. Skipping migration to preserve data.');
      console.log('✅ Your existing data is safe!');
      return;
    }
    
    console.log('⚡ Running migration...');
    console.log('📄 Please run this migration manually in your Supabase dashboard:');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/qyxbottzcfzfdwemvfhc/sql');
    console.log('📁 Copy the contents of: supabase/migrations/20250127181500_add_community_tools.sql');
    console.log('▶️  Paste and run in the SQL Editor');
    console.log('');
    console.log('This migration will:');
    console.log('✅ Add community tools tables (tools, ratings, submissions)');
    console.log('✅ Set up Row Level Security policies');
    console.log('✅ Create storage bucket for thumbnails');
    console.log('✅ Preserve ALL your existing BPS data');
    console.log('❌ Will NOT add any mock/sample data');
    
    return;
    
    console.log('✅ Migration completed!');
    console.log('🎉 Community Tools tables are ready!');
    
    // Verify the tables were created
    const { data: newTables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tools', 'ratings', 'submissions']);
    
    if (!verifyError && newTables) {
      console.log('✅ Verified tables created:', newTables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('📖 Please run the migration manually in Supabase dashboard');
    console.log('📍 File location: supabase/migrations/20250127181500_add_community_tools.sql');
  }
}

// Check if we have required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.log('📋 Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

runMigration();