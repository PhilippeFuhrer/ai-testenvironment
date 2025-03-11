// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from "dotenv";

// Load environment variables from the root directory
config();

// Your Supabase details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache user IP address
let userIpCache: string | null = null;

// Get user IP address
export async function getUserIp(): Promise<string> {
  if (userIpCache) {
    return userIpCache;
  }
  
  try {
    const response = await fetch('/api/get-user-ip');
    const data = await response.json();
    
    // Get the actual IP, not the loopback address
    const ip = data.ip;
    console.log('User IP:', ip);
    
    // If we're getting a loopback address, generate a random identifier instead
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      // Generate a random ID and store it in localStorage to keep it consistent for this browser
      let randomId = localStorage.getItem('user_random_id');
      if (!randomId) {
        randomId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user_random_id', randomId);
      }
      userIpCache = randomId;
      return randomId;
    }
    
    userIpCache = ip;
    return ip;
  } catch (error) {
    console.error('Error getting user IP:', error);
    return 'unknown';
  }
}

// Types for chat history
export type Conversation = {
  id: string;
  title: string;
  bot_type: string;
  created_at: string;
  updated_at: string;
  user_ip?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  message_order: number;
};

// Function to create a new conversation
export async function createConversation(title: string, botType: string) {
  const userIp = await getUserIp();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ title, bot_type: botType, user_ip: userIp }])
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
  console.log('Conversation created:', data);
  return data;
}

// Function to get all conversations for the current user
export async function getConversations() {
  const userIp = await getUserIp();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_ip', userIp)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data;
}

// Function to get a specific conversation with its messages
export const getConversationMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  // Transform the data to match the Message type used in ChatBot
  return data.map(message => ({
    role: message.role === 'user' ? 'User' : 'Arcon GPT',
    content: message.content
  }));
};

// Function to add a message to a conversation
export async function addMessage(
  conversationId: string, 
  role: string, 
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { conversation_id: conversationId, role, content }
    ]);

  // Update the conversation's updated_at timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  console.log('Message added:', data);
  return data;
}

// Function to verify conversation ownership
export async function verifyConversationOwnership(conversationId: string): Promise<boolean> {
  const userIp = await getUserIp();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_ip', userIp)
    .single();
    
  if (error || !data) {
    return false;
  }
  
  return true;
}

// Function to get a formatted date string for display
export function formatChatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Today
  if (date.toDateString() === now.toDateString()) {
    return `Heute, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Gestern, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Other days
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

export const getConversationById = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data;
};
