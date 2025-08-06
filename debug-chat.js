#!/usr/bin/env node

/**
 * Debug Script for Chat Messages
 * 
 * This script checks what chat messages are stored in the database
 * to help debug the chat history loading issue.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Chat Messages Debug Script');
  console.log('=====================================\n');

  try {
    // 1. Get all chat message interactions
    console.log('📊 Fetching all chat message interactions...');
    const { data: chatMessages, error: chatError } = await supabase
      .from('user_documents')
      .select('id, user_id, document_data, created_at')
      .eq('document_type', 'interaction')
      .eq('tool_slug', 'best-possible-self')
      .eq('document_data->>interaction_type', 'chat_message')
      .order('created_at', { ascending: true });

    if (chatError) throw chatError;

    console.log(`Found ${chatMessages?.length || 0} chat messages\n`);

    if (!chatMessages || chatMessages.length === 0) {
      console.log('❌ No chat messages found in database');
      console.log('This could mean:');
      console.log('1. Chat messages are only being saved to sessionStorage');
      console.log('2. Data saving setting is set to "private"');
      console.log('3. Messages exist but with different query parameters');
      return;
    }

    // 2. Group by target_id
    const messagesByTarget = {};
    chatMessages.forEach(msg => {
      const targetId = msg.document_data?.target_id || 'unknown';
      if (!messagesByTarget[targetId]) {
        messagesByTarget[targetId] = [];
      }
      messagesByTarget[targetId].push(msg);
    });

    console.log('📋 Messages grouped by target_id:');
    Object.keys(messagesByTarget).forEach(targetId => {
      const messages = messagesByTarget[targetId];
      console.log(`\n🎯 Target ID: ${targetId}`);
      console.log(`   Messages: ${messages.length}`);
      console.log(`   Users: ${[...new Set(messages.map(m => m.user_id))].join(', ')}`);
      
      messages.forEach((msg, index) => {
        const role = msg.document_data?.role || 'unknown';
        const content = (msg.document_data?.message || '').substring(0, 50) + '...';
        console.log(`   ${index + 1}. [${role}] ${content}`);
      });
    });

    // 3. Get all tool sessions to compare
    console.log('\n📊 Fetching all tool sessions...');
    const { data: toolSessions, error: sessionError } = await supabase
      .from('user_documents')
      .select('id, user_id, document_data, created_at')
      .eq('document_type', 'tool_session')
      .eq('tool_slug', 'best-possible-self')
      .order('created_at', { ascending: true });

    if (sessionError) throw sessionError;

    console.log(`Found ${toolSessions?.length || 0} tool sessions\n`);

    if (toolSessions && toolSessions.length > 0) {
      console.log('📝 Tool sessions:');
      toolSessions.forEach((session, index) => {
        const title = session.document_data?.title || 'Untitled';
        const contentPreview = (session.document_data?.content || '').substring(0, 50) + '...';
        console.log(`   ${index + 1}. ID: ${session.id}, Title: "${title}", Content: ${contentPreview}`);
        
        // Check if this session has any chat messages
        const sessionMessages = messagesByTarget[session.id] || [];
        console.log(`      → Chat messages: ${sessionMessages.length}`);
      });
    }

    // 4. Look for mismatched target_ids
    console.log('\n🔍 Analysis:');
    const sessionIds = (toolSessions || []).map(s => s.id);
    const chatTargetIds = Object.keys(messagesByTarget);
    
    const orphanedChats = chatTargetIds.filter(id => !sessionIds.includes(id));
    if (orphanedChats.length > 0) {
      console.log(`⚠️  Found ${orphanedChats.length} chat target_ids that don't match any tool session:`);
      orphanedChats.forEach(id => console.log(`   - ${id}`));
    }

    const sessionsWithoutChats = sessionIds.filter(id => !chatTargetIds.includes(id));
    if (sessionsWithoutChats.length > 0) {
      console.log(`ℹ️  Found ${sessionsWithoutChats.length} tool sessions without chat messages:`);
      sessionsWithoutChats.forEach(id => console.log(`   - ${id}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };