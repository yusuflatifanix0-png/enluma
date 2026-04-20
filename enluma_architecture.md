# ENLUMA — Technical Architecture & Build Guide
## MVP: Scenario Forge (4–6 Week Sprint)

---

## STACK DECISIONS

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js 14 (App Router) | SSR, SEO, API routes, industry standard |
| Database | Supabase (Postgres) | Auth + DB + Storage + Realtime in one |
| AI Opponent | OpenAI GPT-4o | Best conversational quality, fast |
| Voice Input | OpenAI Whisper API | Accurate transcription, cheap |
| Text-to-Speech | OpenAI TTS (alloy/nova) | AI opponent speaks back |
| Styling | Tailwind CSS | Fast, consistent, no CSS files |
| Payments | Stripe | When ready to charge |
| Hosting | Vercel (frontend) + Supabase (backend) | Free to launch |
| Email | Resend | Simple, developer-friendly |

**Estimated monthly cost at launch: $0–50 (OpenAI API usage only)**

---

## PROJECT STRUCTURE

```
enluma/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx    # Creator home
│   │   ├── scenarios/
│   │   │   ├── page.tsx          # Scenario library
│   │   │   ├── new/page.tsx      # Create scenario
│   │   │   └── [id]/page.tsx     # Edit scenario
│   │   └── analytics/page.tsx    # Performance data
│   ├── (practice)/
│   │   ├── layout.tsx
│   │   └── practice/
│   │       ├── page.tsx          # Pick a scenario
│   │       └── [id]/page.tsx     # LIVE SCENARIO SESSION
│   ├── (public)/
│   │   └── page.tsx              # Landing page
│   ├── api/
│   │   ├── scenario/
│   │   │   ├── create/route.ts
│   │   │   └── list/route.ts
│   │   ├── session/
│   │   │   ├── start/route.ts
│   │   │   ├── message/route.ts  # AI opponent response
│   │   │   ├── score/route.ts    # Scoring engine
│   │   │   └── end/route.ts
│   │   ├── voice/
│   │   │   ├── transcribe/route.ts  # Whisper
│   │   │   └── speak/route.ts       # TTS
│   │   └── auth/
│   │       └── callback/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── scenario/
│   │   ├── ScenarioCard.tsx
│   │   ├── ScenarioBuilder.tsx
│   │   └── ScenarioList.tsx
│   ├── session/
│   │   ├── SessionArena.tsx      # Main practice UI
│   │   ├── MessageBubble.tsx
│   │   ├── VoiceInput.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── SessionReport.tsx
│   └── dashboard/
│       ├── StatsCard.tsx
│       └── RecentSessions.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── openai/
│   │   ├── opponent.ts           # GPT-4o scenario logic
│   │   ├── scorer.ts             # Scoring engine
│   │   ├── whisper.ts            # Transcription
│   │   └── tts.ts                # Text to speech
│   ├── scoring/
│   │   └── engine.ts             # Score calculation
│   └── utils.ts
├── types/
│   └── index.ts                  # All TypeScript types
├── middleware.ts                  # Auth protection
├── .env.local                    # Secrets (never commit)
└── package.json
```

---

## DATABASE SCHEMA (Supabase / Postgres)

```sql
-- USERS (extended from Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text unique,
  role text default 'learner', -- 'creator' | 'learner'
  avatar_url text,
  bio text,
  communication_profile jsonb default '{}', -- ENLUMA CORE data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SCENARIOS (created by creators)
create table public.scenarios (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text, -- 'interview' | 'negotiation' | 'social' | 'sales' | 'conflict'
  difficulty text default 'medium', -- 'easy' | 'medium' | 'hard' | 'extreme'
  cognitive_mode text, -- 'confident' | 'negotiator' | 'charming' | 'calm'
  system_prompt text not null, -- The AI opponent instructions
  opening_line text, -- First thing AI says
  context text, -- Scene setting for the user
  is_public boolean default false,
  is_free boolean default true,
  price_cents integer default 0,
  tags text[] default '{}',
  play_count integer default 0,
  avg_score numeric(4,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SESSIONS (each practice run)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  scenario_id uuid references public.scenarios(id) on delete set null,
  status text default 'active', -- 'active' | 'completed' | 'abandoned'
  mode text default 'text', -- 'text' | 'voice' | 'hybrid'
  messages jsonb default '[]', -- Full conversation history
  duration_seconds integer,
  -- SCORES
  confidence_score integer, -- 0–100
  clarity_score integer,    -- 0–100
  persuasion_score integer, -- 0–100
  stability_score integer,  -- 0–100
  overall_score integer,    -- 0–100
  -- ANALYSIS
  strengths text[],
  weaknesses text[],
  next_actions text[],
  ai_feedback text,
  -- BEHAVIOUR TRACKING
  hesitation_count integer default 0,
  filler_word_count integer default 0,
  avg_response_time_ms integer,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- BEHAVIOUR PATTERNS (the Behaviour Loop Engine data)
create table public.behaviour_patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  pattern_type text, -- 'hesitation' | 'panic' | 'overthink' | 'strength'
  trigger_context text, -- What scenario context triggers this
  frequency integer default 1,
  last_seen_at timestamptz default now(),
  improving boolean default false,
  created_at timestamptz default now()
);

-- CREATOR STATS
create table public.creator_stats (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade unique,
  total_scenarios integer default 0,
  total_plays integer default 0,
  total_learners integer default 0,
  avg_scenario_score numeric(4,2) default 0,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.sessions enable row level security;
alter table public.behaviour_patterns enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Public scenarios are viewable" on scenarios for select using (is_public = true or creator_id = auth.uid());
create policy "Creators manage own scenarios" on scenarios for all using (creator_id = auth.uid());
create policy "Users see own sessions" on sessions for all using (user_id = auth.uid());
create policy "Users see own patterns" on behaviour_patterns for all using (user_id = auth.uid());
```

---

## ENVIRONMENT VARIABLES (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## CORE AI LOGIC: OPPONENT ENGINE

```typescript
// lib/openai/opponent.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface OpponentConfig {
  systemPrompt: string
  cognitiveMode: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

const DIFFICULTY_MODIFIERS = {
  easy:    'Be patient, forgiving, and give the user easy openings.',
  medium:  'Be realistic. Push back occasionally but stay professional.',
  hard:    'Be challenging. Use pressure tactics. Do not give easy answers.',
  extreme: 'Be very demanding. Use interruptions, objections, and real pressure. Do not yield easily.'
}

const COGNITIVE_MODE_MODIFIERS = {
  confident:   'The user is training to project confidence. Test their directness.',
  negotiator:  'The user is training negotiation. Drive hard bargains.',
  charming:    'The user is training social charm. Be warm but not easily impressed.',
  calm:        'The user is training emotional stability. Introduce frustrating elements.'
}

export async function getOpponentResponse(config: OpponentConfig): Promise<string> {
  const systemContext = `
${config.systemPrompt}

DIFFICULTY: ${DIFFICULTY_MODIFIERS[config.difficulty]}
COGNITIVE MODE CONTEXT: ${COGNITIVE_MODE_MODIFIERS[config.cognitiveMode] || ''}

IMPORTANT RULES:
- Stay completely in character. Never break the scene.
- Keep responses concise and conversational (2–4 sentences max).
- React authentically to what the user says.
- Your goal is to create a realistic, challenging scenario.
- Do NOT give feedback or coaching. You are the opponent, not the tutor.
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemContext },
      ...config.messages
    ],
    max_tokens: 200,
    temperature: 0.85,
  })

  return response.choices[0].message.content || ''
}
```

---

## CORE AI LOGIC: SCORING ENGINE

```typescript
// lib/openai/scorer.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface SessionData {
  scenario: string
  cognitiveMode: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  hesitationCount: number
  avgResponseTimeMs: number
  fillerWordCount: number
}

export interface ScoreResult {
  confidence: number    // 0–100
  clarity: number       // 0–100
  persuasion: number    // 0–100
  stability: number     // 0–100
  overall: number       // 0–100
  strengths: string[]
  weaknesses: string[]
  nextActions: string[]
  feedback: string
}

export async function scoreSession(data: SessionData): Promise<ScoreResult> {
  const userMessages = data.messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n---\n')

  const prompt = `
You are ENLUMA's evaluation engine. Analyse this communication session objectively.

SCENARIO: ${data.scenario}
COGNITIVE MODE: ${data.cognitiveMode}
HESITATION COUNT: ${data.hesitationCount}
AVERAGE RESPONSE TIME: ${data.avgResponseTimeMs}ms
FILLER WORD COUNT: ${data.fillerWordCount}

USER'S MESSAGES:
${userMessages}

Score the user on each dimension from 0–100 based strictly on their actual communication:

CONFIDENCE INDEX: Directness, lack of hedging, decisive language, not over-apologising.
CLARITY SCORE: Structure, vocabulary precision, avoiding rambling, clear point delivery.
PERSUASION RATE: Ability to move the conversation toward their goal, logical framing, emotional intelligence.
EMOTIONAL STABILITY: Consistency under pressure, no panic language, controlled responses.

Respond ONLY in this exact JSON format:
{
  "confidence": <number>,
  "clarity": <number>,
  "persuasion": <number>,
  "stability": <number>,
  "overall": <number>,
  "strengths": ["<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness>", "<specific weakness>"],
  "nextActions": ["<concrete action>", "<concrete action>"],
  "feedback": "<2–3 sentence honest coaching summary>"
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return result as ScoreResult
}
```

---

## API ROUTES

### Session Message (the live AI exchange)
```typescript
// app/api/session/message/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOpponentResponse } from '@/lib/openai/opponent'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, userMessage, scenario, messages } = await req.json()

  // Detect filler words
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'honestly']
  const fillerCount = fillerWords.filter(w => userMessage.toLowerCase().includes(w)).length

  // Get AI response
  const aiResponse = await getOpponentResponse({
    systemPrompt: scenario.system_prompt,
    cognitiveMode: scenario.cognitive_mode || 'confident',
    difficulty: scenario.difficulty,
    messages: [...messages, { role: 'user', content: userMessage }]
  })

  // Update session in DB
  const updatedMessages = [
    ...messages,
    { role: 'user', content: userMessage, timestamp: Date.now() },
    { role: 'assistant', content: aiResponse, timestamp: Date.now() }
  ]

  await supabase
    .from('sessions')
    .update({
      messages: updatedMessages,
      filler_word_count: (messages.filter((m: any) => m.role === 'user').length > 0 ? fillerCount : fillerCount)
    })
    .eq('id', sessionId)

  return NextResponse.json({ aiResponse, updatedMessages })
}
```

### Session End + Score
```typescript
// app/api/session/score/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { scoreSession } from '@/lib/openai/scorer'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, scenario, messages, hesitationCount, avgResponseTimeMs, fillerWordCount } = await req.json()

  const scores = await scoreSession({
    scenario: scenario.title,
    cognitiveMode: scenario.cognitive_mode || 'confident',
    messages,
    hesitationCount,
    avgResponseTimeMs,
    fillerWordCount
  })

  await supabase
    .from('sessions')
    .update({
      status: 'completed',
      confidence_score: scores.confidence,
      clarity_score: scores.clarity,
      persuasion_score: scores.persuasion,
      stability_score: scores.stability,
      overall_score: scores.overall,
      strengths: scores.strengths,
      weaknesses: scores.weaknesses,
      next_actions: scores.nextActions,
      ai_feedback: scores.feedback,
      hesitation_count: hesitationCount,
      avg_response_time_ms: avgResponseTimeMs,
      filler_word_count: fillerWordCount,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  return NextResponse.json(scores)
}
```

---

## WEEK-BY-WEEK BUILD PLAN

### WEEK 1 — Foundation
- [ ] Init Next.js 14 project (`npx create-next-app@latest enluma`)
- [ ] Set up Supabase project + run schema SQL
- [ ] Configure auth (email + Google OAuth via Supabase)
- [ ] Build middleware.ts for route protection
- [ ] Set up Tailwind + global design tokens
- [ ] Build layout, login, signup pages

### WEEK 2 — Scenario Builder
- [ ] Scenario database + API routes
- [ ] ScenarioBuilder component (form with live preview)
- [ ] Creator dashboard skeleton
- [ ] Seed 5 scenarios you've written yourself as creator

### WEEK 3 — Session Arena (Core Feature)
- [ ] SessionArena.tsx — the live practice UI
- [ ] Text input + send flow
- [ ] AI opponent integration (opponent.ts → API route)
- [ ] Message bubbles + conversation display
- [ ] Session start/end logic

### WEEK 4 — Voice + Scoring
- [ ] VoiceInput.tsx — browser MediaRecorder → Whisper API
- [ ] TTS response (AI opponent speaks back)
- [ ] Scoring engine integration (scorer.ts → API route)
- [ ] SessionReport.tsx — scores, strengths, weaknesses, next actions
- [ ] Behaviour pattern detection + storage

### WEEK 5 — Polish + Analytics
- [ ] Creator analytics dashboard
- [ ] Score history + performance graph
- [ ] Mobile responsive pass
- [ ] Loading states, error handling, edge cases
- [ ] Internal testing with 5+ full sessions

### WEEK 6 — Launch
- [ ] Landing page (your face, your scenarios, live demo)
- [ ] Deploy to Vercel
- [ ] Custom domain (enluma.com or enluma.app)
- [ ] Stripe payment integration (optional at launch)
- [ ] Announce to your first 50 users

---

## NEXT STEPS RIGHT NOW

1. Run: `npx create-next-app@latest enluma --typescript --tailwind --app`
2. Create Supabase project at supabase.com
3. Run the database schema SQL above in Supabase SQL editor
4. Add .env.local with your keys
5. Come back here — we build each component together

---
*Enluma MVP Build Guide v1.0 — April 2026*
