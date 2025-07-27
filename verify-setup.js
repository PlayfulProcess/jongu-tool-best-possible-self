// Verification script to check if migration was successful
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check BPS tables (should already exist)
    console.log('📋 Checking BPS tables...');
    const bpsTables = ['profiles', 'journal_entries', 'chat_messages'];
    
    for (const table of bpsTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: OK`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }
    
    // Check Community Tools tables (should be newly created)
    console.log('\n🌱 Checking Community Tools tables...');
    const communityTables = ['tools', 'ratings', 'submissions'];
    
    for (const table of communityTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: OK (${data.length} rows)`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }
    
    // Check storage bucket
    console.log('\n📁 Checking storage bucket...');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.log(`❌ Storage: ${error.message}`);
      } else {
        const thumbnailBucket = data.find(b => b.name === 'thumbnails');
        if (thumbnailBucket) {
          console.log(`✅ Thumbnails bucket: OK`);
        } else {
          console.log(`❌ Thumbnails bucket: Not found`);
        }
      }
    } catch (e) {
      console.log(`❌ Storage: ${e.message}`);
    }
    
    console.log('\n🎉 Verification complete!');
    console.log('🚀 You can now test your app at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifySetup();