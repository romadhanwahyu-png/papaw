// ============================================================
// Papaw — Centralized Database Queries
// ============================================================

import { supabaseServer } from './supabase-server';
import { 
  Profile, Session, Message, Badge, Whisper, 
  TopicFrequency, Highlight, HighlightType,
  TodaySummary, WeekSummary, CriticalAlert,
  Language, MissionState
} from '@/types';
import { generateParentKey } from './parent-key';

// ============================================================
// PROFILE
// ============================================================

export async function createProfile(childName: string, language: Language): Promise<Profile> {
  const parentKey = generateParentKey();
  
  const { data, error } = await supabaseServer
    .from('profiles')
    .insert({
      child_name: childName,
      papaw_name: 'Papaw',
      default_language: language,
      parent_view_key: parentKey,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return data as Profile;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function getProfileByParentKey(key: string): Promise<Profile | null> {
  const { data, error } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq('parent_view_key', key)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(id: string, updates: Partial<Pick<Profile, 'child_name' | 'papaw_name' | 'default_language'>>): Promise<Profile | null> {
  const { data, error } = await supabaseServer
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return data as Profile;
}

// ============================================================
// SESSIONS
// ============================================================

export async function createSession(profileId: string, missionState?: MissionState): Promise<Session> {
  const { data, error } = await supabaseServer
    .from('sessions')
    .insert({
      profile_id: profileId,
      mission_state: missionState || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data as Session;
}

export async function getActiveSession(profileId: string): Promise<Session | null> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data, error } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .is('ended_at', null)
    .gte('started_at', thirtyMinAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as Session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return null;
  return data as Session;
}

export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  await supabaseServer
    .from('sessions')
    .update(updates)
    .eq('id', sessionId);
}

export async function endSession(sessionId: string): Promise<void> {
  await supabaseServer
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function incrementMessageCount(sessionId: string): Promise<void> {
  // Atomic increment via RPC (see 003_rpcs.sql) — avoids the read-modify-write race.
  const { error } = await supabaseServer.rpc('increment_message_count', {
    p_session_id: sessionId,
  });
  if (error) console.error('incrementMessageCount failed:', error.message);
}

// ============================================================
// MESSAGES
// ============================================================

export async function saveMessage(
  sessionId: string,
  role: 'child' | 'papaw',
  content: string
): Promise<Message> {
  const { data, error } = await supabaseServer
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save message: ${error.message}`);
  return data as Message;
}

export async function getRecentMessages(sessionId: string, limit: number = 10): Promise<Message[]> {
  // Fetch the newest `limit` messages (DESC), then reverse to chronological order
  // so the LLM receives history oldest → newest.
  const { data, error } = await supabaseServer
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return ((data || []) as Message[]).reverse();
}

export async function updateMessageTags(
  messageId: string,
  topicTags: string[],
  isCritical: boolean
): Promise<void> {
  await supabaseServer
    .from('messages')
    .update({
      topic_tags: topicTags,
      is_critical_topic: isCritical,
    })
    .eq('id', messageId);
}

// ============================================================
// BADGES
// ============================================================

export async function getBadges(profileId: string): Promise<Badge[]> {
  const { data, error } = await supabaseServer
    .from('badges')
    .select('*')
    .eq('profile_id', profileId)
    .order('earned_at', { ascending: false });

  if (error) return [];
  return (data || []) as Badge[];
}

export async function awardBadge(
  profileId: string,
  badgeKey: string,
  title: string,
  icon: string = '🏅'
): Promise<Badge | null> {
  const { data, error } = await supabaseServer
    .from('badges')
    .upsert({
      profile_id: profileId,
      badge_key: badgeKey,
      title,
      icon,
    }, {
      onConflict: 'profile_id,badge_key',
    })
    .select()
    .single();

  if (error) return null;
  return data as Badge;
}

export async function hasBadge(profileId: string, badgeKey: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from('badges')
    .select('id')
    .eq('profile_id', profileId)
    .eq('badge_key', badgeKey)
    .single();

  return !!data;
}

// ============================================================
// WHISPERS
// ============================================================

export async function createWhisper(
  profileId: string,
  message: string,
  scheduledFor?: string
): Promise<Whisper> {
  const { data, error } = await supabaseServer
    .from('whispers')
    .insert({
      profile_id: profileId,
      message,
      scheduled_for: scheduledFor || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create whisper: ${error.message}`);
  return data as Whisper;
}

export async function getPendingWhispers(profileId: string): Promise<Whisper[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from('whispers')
    .select('*')
    .eq('profile_id', profileId)
    .is('delivered_at', null)
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data || []) as Whisper[];
}

export async function markWhisperDelivered(whisperId: string): Promise<void> {
  await supabaseServer
    .from('whispers')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', whisperId);
}

/**
 * Whether any whisper for this profile was already delivered at/after `sinceIso`.
 * Used to enforce "one whisper per session" — we don't inject more whispers into
 * the prompt once one has been delivered within the current session window.
 */
export async function hasDeliveredWhisperSince(profileId: string, sinceIso: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from('whispers')
    .select('id')
    .eq('profile_id', profileId)
    .gte('delivered_at', sinceIso)
    .limit(1);

  return !!(data && data.length > 0);
}

export async function getWhispers(profileId: string): Promise<Whisper[]> {
  const { data, error } = await supabaseServer
    .from('whispers')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []) as Whisper[];
}

// ============================================================
// TOPIC FREQUENCY
// ============================================================

export async function updateTopicFrequency(profileId: string, topics: string[]): Promise<void> {
  if (topics.length === 0) return;
  // Atomic batch upsert+increment via RPC (see 003_rpcs.sql) — replaces the
  // per-topic select-then-write loop (N+1 + racy).
  const { error } = await supabaseServer.rpc('increment_topic_frequency', {
    p_profile_id: profileId,
    p_topics: topics,
  });
  if (error) console.error('updateTopicFrequency failed:', error.message);
}

export async function getTopicFrequency(profileId: string): Promise<TopicFrequency[]> {
  const { data, error } = await supabaseServer
    .from('topic_frequency')
    .select('*')
    .eq('profile_id', profileId)
    .order('count', { ascending: false });

  if (error) return [];
  return (data || []) as TopicFrequency[];
}

// ============================================================
// HIGHLIGHTS
// ============================================================

export async function saveHighlight(
  profileId: string,
  messageId: string,
  highlightType: HighlightType,
  excerpt: string
): Promise<Highlight | null> {
  const { data, error } = await supabaseServer
    .from('highlights')
    .insert({
      profile_id: profileId,
      message_id: messageId,
      highlight_type: highlightType,
      excerpt,
    })
    .select()
    .single();

  if (error) return null;
  return data as Highlight;
}

export async function getHighlights(
  profileId: string,
  dateRange: 'today' | 'week' | 'month' = 'week'
): Promise<Highlight[]> {
  const now = new Date();
  let since: Date;

  switch (dateRange) {
    case 'today':
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const { data, error } = await supabaseServer
    .from('highlights')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []) as Highlight[];
}

// ============================================================
// PAPA VIEW ANALYTICS
// ============================================================

export async function getTodaySummary(profileId: string): Promise<TodaySummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get today's sessions
  const { data: sessions } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .gte('started_at', todayStart.toISOString());

  const sessionList = (sessions || []) as Session[];
  const sessionIds = sessionList.map((s: Session) => s.id);

  // Get today's messages
  let messageCount = 0;
  const criticalAlerts: CriticalAlert[] = [];
  const topicCounts: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: messages } = await supabaseServer
      .from('messages')
      .select('*')
      .in('session_id', sessionIds);

    const msgList = messages || [];
    messageCount = msgList.length;

    for (const msg of msgList) {
      // Count topics
      if (msg.topic_tags) {
        for (const tag of msg.topic_tags) {
          topicCounts[tag] = (topicCounts[tag] || 0) + 1;
        }
      }
      // Collect critical alerts
      if (msg.is_critical_topic && msg.role === 'child') {
        criticalAlerts.push({
          messageId: msg.id,
          topic: (msg.topic_tags || [])[0] || 'unknown',
          excerpt: msg.content.substring(0, 100),
          timestamp: msg.created_at,
        });
      }
    }
  }

  // Calculate total duration
  let totalMinutes = 0;
  for (const s of sessionList) {
    const start = new Date(s.started_at).getTime();
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    totalMinutes += (end - start) / (1000 * 60);
  }

  // Sort topics by frequency
  const dominantTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  return {
    sessionCount: sessionList.length,
    messageCount,
    totalDurationMinutes: Math.round(totalMinutes),
    dominantTopics,
    criticalTopicAlerts: criticalAlerts,
  };
}

export async function getWeekSummary(profileId: string): Promise<WeekSummary> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: sessions } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .gte('started_at', weekAgo.toISOString());

  const sessionList = sessions || [];

  // Daily activity
  const dailyMap: Record<string, number> = {};
  const sessionIds = ((sessionList || []) as Session[]).map((s: Session) => s.id);
  
  let trendingTopics: string[] = [];

  if (sessionIds.length > 0) {
    const { data: messages } = await supabaseServer
      .from('messages')
      .select('*')
      .in('session_id', sessionIds);

    const topicCounts: Record<string, number> = {};
    for (const msg of (messages || [])) {
      // Daily counts
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;

      // Topic counts
      if (msg.topic_tags) {
        for (const tag of msg.topic_tags) {
          topicCounts[tag] = (topicCounts[tag] || 0) + 1;
        }
      }
    }

    trendingTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  // Calculate streak
  const activeDates = new Set(((sessionList || []) as Session[]).map((s: Session) => 
    new Date(s.started_at).toISOString().split('T')[0]
  ));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break; // Streak broken
    }
  }

  const dailyActivity = Object.entries(dailyMap)
    .map(([date, messageCount]) => ({ date, messageCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    streakDays: streak,
    totalSessions: sessionList.length,
    trendingTopics,
    dailyActivity,
  };
}

export async function getChatHistory(
  profileId: string,
  page: number = 1,
  limit: number = 50
): Promise<Message[]> {
  // Get all session IDs for this profile
  const { data: sessions } = await supabaseServer
    .from('sessions')
    .select('id')
    .eq('profile_id', profileId);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = (sessions as Session[]).map((s: Session) => s.id);
  const offset = (page - 1) * limit;

  const { data, error } = await supabaseServer
    .from('messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data || []) as Message[];
}
