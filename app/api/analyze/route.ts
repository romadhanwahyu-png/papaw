// ============================================================
// Papaw — Analyze API Route
// ============================================================
//
// Kept for backward compatibility / manual re-analysis. The main chat and
// mission flows now call `runAnalysis` in-process via `after()` instead of
// posting to this endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest } from '@/types';
import { runAnalysis } from '@/lib/analyze';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { messageId, childMessage, papawResponse, profileId } = body;

    if (!messageId || !childMessage || !profileId) {
      return NextResponse.json(
        { error: 'messageId, childMessage, and profileId are required' },
        { status: 400 }
      );
    }

    await runAnalysis({
      messageId,
      childMessage,
      papawResponse: papawResponse || '',
      profileId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analyze API Error]', error);
    // Non-critical — return success anyway to not break the flow
    return NextResponse.json({ success: true });
  }
}
