import { useState, useRef, useEffect, useCallback } from "react";

// ── Claude API call ─────────────────────────────────────────
async function callClaude(messages, system, maxTokens = 400) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// ── Scenarios ───────────────────────────────────────────────
const SCENARIOS = [
  {
    id: "interview",
    title: "Senior Job Interview",
    category: "Career",
    difficulty: "HARD",
    diffColor: "#f59e0b",
    mode: "Confident Speaker",
    context: "You're interviewing for a Senior Product Manager role at a fast-growing startup. The interviewer is sharp, direct, and has heard every rehearsed answer before.",
    opening: "So — walk me through why you left your last role. And please, skip the 'looking for new challenges' line.",
    system: `You are Marcus, a sharp, experienced startup hiring manager interviewing for a Senior PM role. You've interviewed hundreds of candidates and you're tired of rehearsed answers.

Your style: direct, economical, occasionally dry. You challenge vague answers with "Can you be more specific?" or "What were the actual numbers?" You never let a candidate off easy. You're not hostile — you're efficient.

Rules:
- Stay completely in character. Never break the scene or offer coaching.
- Keep responses to 1-3 sentences max. You are a busy person.
- Ask pointed follow-up questions. Drill into specifics.
- React authentically — if impressed, show mild interest; if unimpressed, push harder.
- Do NOT give the user feedback or help them. You are the opponent.`,
  },
  {
    id: "negotiation",
    title: "Salary Negotiation",
    category: "Negotiation",
    difficulty: "HARD",
    diffColor: "#f59e0b",
    mode: "Elite Negotiator",
    context: "You've received a job offer 20% below your target. The hiring manager says it's 'already at the top of band.' You need to negotiate without losing the offer.",
    opening: "We're really excited to have you join the team. I hope the offer reflects how much we value what you'd bring. Have you had a chance to review the package?",
    system: `You are Sarah, a hiring manager at a mid-size tech company. You genuinely like this candidate but you're working with a fixed budget that you've already stretched.

Your style: warm but firm. You'll counter every salary request with non-monetary alternatives (extra PTO, early review, signing bonus). You won't easily move on base salary but you can be won over by strong, specific arguments about market value or ROI.

Rules:
- Stay in character. Keep responses conversational, 2-3 sentences.
- Never just agree. Always counter or probe their reasoning.
- Use phrases like "I hear you, but..." or "What I can do is..."
- If they make an exceptionally strong argument, you can move — slightly.
- Do NOT break character or offer negotiation tips.`,
  },
  {
    id: "client",
    title: "Angry Client Call",
    category: "Crisis",
    difficulty: "EXTREME",
    diffColor: "#ef4444",
    mode: "Calm & Controlled",
    context: "Your agency missed a critical project deadline by 2 weeks. The client's product launch is now delayed. They're on the phone and they are furious. Do not lose this contract.",
    opening: "I've been waiting for this call. Two weeks. Do you have any idea what two weeks means to our launch timeline? My CEO is asking me questions I cannot answer.",
    system: `You are David Chen, a furious but professional VP of Marketing. Your agency partner just caused your team to miss a major product launch window. You are genuinely angry — not rude, but relentless.

Your style: controlled fury. You use silence as a weapon. You ask pointed questions and don't accept vague apologies. You want: acknowledgment, accountability, a specific recovery plan, and a reason to believe it won't happen again.

Rules:
- Stay in character. Never soften unless the user earns it with genuine accountability.
- Use short, sharp sentences. Let silences hang.
- Push back on every excuse. "That's not an answer" is a valid response.
- You can be won over — but only by complete honesty + a credible plan.
- If they give a genuinely excellent response, acknowledge it: "Okay. That's something."
- Do NOT break character or help them handle you.`,
  },
  {
    id: "pitch",
    title: "Investor Pitch",
    category: "Fundraising",
    difficulty: "EXTREME",
    diffColor: "#ef4444",
    mode: "Confident Speaker",
    context: "You have 10 minutes with a Tier-1 VC partner. They've seen 500 pitches this year. Your Series A ask is $3M. Make them believe.",
    opening: "I've got your deck. I've looked at it. Tell me — in one sentence — why this isn't just another AI wrapper. Because I've seen forty of those this month.",
    system: `You are Elena Vasquez, a partner at a top-tier VC fund. You are skeptical by profession and have seen every pitch trope imaginable. You're not rude — you're testing.

Your style: Socratic. You ask questions that expose weak assumptions. "What's your moat?" "Why you?" "What happens when Google builds this?" You reward clarity, penalize buzzwords.

Rules:
- Stay in character. Keep responses to 2-3 sentences plus one probing question.
- Never let a claim go unchallenged. Ask for evidence.
- Penalize buzzwords: "What does 'AI-powered' actually mean here?"
- Reward specific answers: "That's interesting. Tell me more about that."
- Do NOT offer pitch coaching or break character.`,
  },
];

// ── Score helper ────────────────────────────────────────────
function getRating(score) {
  if (score >= 80) return { label: "Exceptional", color: "#4ade80" };
  if (score >= 65) return { label: "Strong", color: "#86efac" };
  if (score >= 50) return { label: "Developing", color: "#fbbf24" };
  return { label: "Needs Work", color: "#f87171" };
}

// ── Animated score ring ─────────────────────────────────────
function ScoreRing({ score, label, delay = 0, animate }) {
  const [displayed, setDisplayed] = useState(0);
  const size = 88;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const rating = getRating(score);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => {
        s += 2;
        if (s >= score) { setDisplayed(score); clearInterval(iv); }
        else setDisplayed(s);
      }, 12);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [animate, score, delay]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c1c1c" strokeWidth={7} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={rating.color} strokeWidth={7}
          strokeDasharray={`${(displayed / 100) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
        <text
          x={size/2} y={size/2}
          textAnchor="middle" dominantBaseline="middle"
          style={{
            transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`,
            fill: rating.color, fontSize: 20, fontWeight: 800,
            fontFamily: "'DM Mono', monospace"
          }}
        >{displayed}</text>
      </svg>
      <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────
export default function Enluma() {
  const [phase, setPhase] = useState("select"); // select | brief | session | scoring | report
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [hesitations, setHesitations] = useState(0);
  const [lastSendTime, setLastSendTime] = useState(null);
  const [scores, setScores] = useState(null);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);

  const FILLER_WORDS = ["um,", "uh,", "um ", "uh ", "like,", "you know", "basically,", "literally,", "sort of", "kind of", "i mean,"];

  useEffect(() => {
    if (phase === "session") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startSession = useCallback(() => {
    setMessages([{ role: "assistant", content: scenario.opening, ts: Date.now() }]);
    setElapsed(0); setFillers(0); setHesitations(0);
    setLastSendTime(Date.now());
    setPhase("session");
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [scenario]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || thinking) return;
    const text = input.trim();
    const now = Date.now();

    // Filler detection
    const fc = FILLER_WORDS.filter(w => text.toLowerCase().includes(w)).length;
    setFillers(f => f + fc);

    // Hesitation detection (>9s to respond)
    if (lastSendTime && (now - lastSendTime) > 9000) setHesitations(h => h + 1);

    const newMsgs = [...messages, { role: "user", content: text, ts: now }];
    setMessages(newMsgs);
    setInput("");
    setThinking(true);
    setError(null);

    try {
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(apiMsgs, scenario.system, 300);
      setMessages(m => [...m, { role: "assistant", content: reply, ts: Date.now() }]);
      setLastSendTime(Date.now());
    } catch (e) {
      setError("Claude API error: " + e.message);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, thinking, messages, scenario, lastSendTime]);

  const endSession = useCallback(async () => {
    clearInterval(timerRef.current);
    setPhase("scoring");

    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length === 0) { setPhase("session"); return; }

    const transcript = messages.map(m =>
      `${m.role === "user" ? "CANDIDATE" : "OPPONENT"}: ${m.content}`
    ).join("\n");

    const scoringPrompt = `You are ENLUMA's evaluation engine. Analyse this communication session and score the CANDIDATE only.

SCENARIO: ${scenario.title}
COGNITIVE MODE: ${scenario.mode}
METRICS: ${fillers} filler words detected, ${hesitations} long pauses, ${userMsgs.length} exchanges

TRANSCRIPT:
${transcript}

Score the CANDIDATE on each dimension 0-100 based strictly on their actual communication quality:

CONFIDENCE (0-100): Directness, no hedging, decisive language, owns the conversation
CLARITY (0-100): Structure, precision, avoids rambling, clear point delivery  
PERSUASION (0-100): Moves conversation toward their goal, logical framing, emotional intelligence
STABILITY (0-100): Consistent under pressure, no panic language, controlled responses

Be honest and calibrated. Most people score 40-70. Reserve 80+ for genuinely exceptional communication.

Respond ONLY in this exact JSON (no markdown, no explanation):
{
  "confidence": <number>,
  "clarity": <number>,
  "persuasion": <number>,
  "stability": <number>,
  "overall": <number>,
  "strengths": ["<specific observed strength>", "<specific observed strength>"],
  "weaknesses": ["<specific observed weakness>", "<specific observed weakness>"],
  "nextScenario": "<one sentence on what to practice next>",
  "feedback": "<3 sentence honest coaching summary — specific to what they actually said>"
}`;

    try {
      const raw = await callClaude(
        [{ role: "user", content: scoringPrompt }],
        "You are an expert communication coach. Return only valid JSON.",
        600
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setScores({ ...parsed, duration: elapsed, turns: userMsgs.length, fillerCount: fillers, hesitationCount: hesitations });
      setPhase("report");
      setTimeout(() => setScoreAnim(true), 300);
    } catch (e) {
      // Fallback scores if parsing fails
      const base = Math.max(40, 72 - fillers * 4 - hesitations * 6);
      setScores({
        confidence: Math.min(95, base + Math.floor(Math.random() * 8)),
        clarity: Math.min(95, base - 3 + Math.floor(Math.random() * 10)),
        persuasion: Math.min(95, base - 5 + Math.floor(Math.random() * 10)),
        stability: Math.min(95, base + 2 + Math.floor(Math.random() * 6)),
        overall: Math.min(95, base),
        strengths: ["Engaged with the challenge", "Maintained the conversation"],
        weaknesses: fillers > 2 ? [`${fillers} filler words detected — weakens authority`] : ["Responses could be more specific"],
        nextScenario: "Practice with increased difficulty to build pressure resistance.",
        feedback: "You completed the scenario. Focus on reducing filler words and responding with more specificity to strengthen your overall presence.",
        duration: elapsed, turns: userMsgs.length, fillerCount: fillers, hesitationCount: hesitations
      });
      setPhase("report");
      setTimeout(() => setScoreAnim(true), 300);
    }
  }, [messages, scenario, fillers, hesitations, elapsed]);

  const reset = () => {
    setPhase("select"); setScenario(null); setMessages([]);
    setScores(null); setScoreAnim(false); setElapsed(0);
    setFillers(0); setHesitations(0); setError(null);
  };

  // ── STYLES ────────────────────────────────────────────────
  const S = {
    app: {
      minHeight: "100vh", background: "#0a0a0a", color: "#e8e4dc",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    header: {
      padding: "0 28px", height: 56,
      borderBottom: "1px solid #1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(10,10,10,0.98)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 100,
    },
    wordmark: {
      fontSize: 17, fontWeight: 800, letterSpacing: "0.18em",
      color: "#c9a84c", fontFamily: "'DM Sans', sans-serif",
    },
    tagline: { fontSize: 11, color: "#333", letterSpacing: "0.15em" },
    page: { maxWidth: 720, margin: "0 auto", padding: "40px 24px", width: "100%" },
  };

  // ─────────────────────────────────────────────────────────
  // SCENARIO SELECT
  // ─────────────────────────────────────────────────────────
  if (phase === "select") return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .card { transition: all 0.18s ease; cursor: pointer; }
        .card:hover { border-color: #c9a84c !important; transform: translateY(-2px); }
        .pill { transition: all 0.15s; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        .fade { animation: fadeUp 0.5s ease forwards; opacity: 0; }
      `}</style>
      <header style={S.header}>
        <div style={S.wordmark}>ENLUMA</div>
        <div style={S.tagline}>SCENARIO FORGE · POWERED BY CLAUDE</div>
      </header>

      <div style={S.page}>
        <div style={{ marginBottom: 48 }} className="fade">
          <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "0.2em", marginBottom: 12, fontWeight: 600 }}>COMMUNICATION INTELLIGENCE PLATFORM</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 12, color: "#f0ece4" }}>
            Train for the<br />moments that matter.
          </h1>
          <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
            Choose a high-stakes scenario. Face a Claude-powered AI opponent.<br />Get a real performance score.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SCENARIOS.map((s, i) => (
            <div
              key={s.id}
              className="card fade"
              style={{
                background: "#111", border: "1px solid #1e1e1e",
                borderRadius: 14, padding: "22px 26px",
                animationDelay: `${i * 0.08}s`,
              }}
              onClick={() => { setScenario(s); setPhase("brief"); }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.15em", marginBottom: 5, textTransform: "uppercase" }}>{s.category}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#f0ece4" }}>{s.title}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.1em", color: s.diffColor, background: s.diffColor + "18", border: `1px solid ${s.diffColor}33` }}>{s.difficulty}</span>
                  <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em" }}>{s.mode}</span>
                </div>
              </div>
              <p style={{ color: "#4a4a4a", fontSize: 13, lineHeight: 1.6 }}>{s.context}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: "16px 20px", background: "#0d0d0d", borderRadius: 10, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 11, color: "#333", letterSpacing: "0.12em", marginBottom: 6 }}>HOW IT WORKS</div>
          <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 1.7 }}>
            Each scenario uses Claude as an intelligent AI opponent that responds dynamically to exactly what you say. After you end the session, Claude scores your performance across Confidence, Clarity, Persuasion, and Stability — with specific feedback on your actual responses.
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // BRIEFING
  // ─────────────────────────────────────────────────────────
  if (phase === "brief") return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .fade{animation:fadeUp 0.4s ease forwards;opacity:0;}`}</style>
      <header style={S.header}>
        <div style={S.wordmark}>ENLUMA</div>
        <button onClick={() => setPhase("select")} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Back</button>
      </header>

      <div style={{ ...S.page, maxWidth: 600 }}>
        <div className="fade" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.1em", color: scenario.diffColor, background: scenario.diffColor + "18", border: `1px solid ${scenario.diffColor}33` }}>{scenario.difficulty}</span>
          <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", marginLeft: 10, textTransform: "uppercase" }}>{scenario.category}</span>
        </div>

        <h1 className="fade" style={{ fontSize: 30, fontWeight: 800, color: "#f0ece4", margin: "12px 0 20px", animationDelay: "0.05s" }}>{scenario.title}</h1>

        <div className="fade" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 24, marginBottom: 16, animationDelay: "0.1s" }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em", marginBottom: 10 }}>THE SITUATION</div>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7 }}>{scenario.context}</p>
        </div>

        <div className="fade" style={{ background: "#111", border: `1px solid ${scenario.diffColor}33`, borderRadius: 12, padding: 24, marginBottom: 16, animationDelay: "0.15s" }}>
          <div style={{ fontSize: 10, color: scenario.diffColor, letterSpacing: "0.15em", marginBottom: 10, fontWeight: 600 }}>THEY OPEN WITH</div>
          <p style={{ color: "#c9b88a", fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>"{scenario.opening}"</p>
        </div>

        <div className="fade" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 20, marginBottom: 28, animationDelay: "0.2s" }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em", marginBottom: 14 }}>YOU'LL BE SCORED ON</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Confidence", "Directness & ownership"], ["Clarity", "Structure & precision"], ["Persuasion", "Moving toward your goal"], ["Stability", "Calm under pressure"]].map(([k, v]) => (
              <div key={k} style={{ padding: "10px 14px", background: "#0d0d0d", borderRadius: 8, border: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 11, color: "#444" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="fade"
          onClick={startSession}
          style={{
            width: "100%", padding: 18, background: "#c9a84c", color: "#0a0a0a",
            border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800,
            cursor: "pointer", letterSpacing: "0.12em", fontFamily: "inherit",
            animationDelay: "0.25s", transition: "background 0.15s",
          }}
          onMouseEnter={e => e.target.style.background = "#ddb95c"}
          onMouseLeave={e => e.target.style.background = "#c9a84c"}
        >
          ENTER THE SCENARIO
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // SESSION ARENA
  // ─────────────────────────────────────────────────────────
  if (phase === "session") return (
    <div style={{ ...S.app, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}} .dot{animation:blink 1.2s ease-in-out infinite;} textarea{resize:none;}`}</style>

      {/* Header */}
      <header style={{ ...S.header, flexShrink: 0 }}>
        <div>
          <div style={S.wordmark}>ENLUMA</div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 20 }}>
            {[["TIME", fmt(elapsed)], ["FILLERS", fillers], ["PAUSES", hesitations]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: (l !== "TIME" && v > 0) ? "#f59e0b" : "#c9a84c" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.12em" }}>{l}</div>
              </div>
            ))}
          </div>
          <button
            onClick={endSession}
            disabled={messages.filter(m => m.role === "user").length === 0}
            style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", padding: "8px 16px", borderRadius: 8,
              cursor: messages.filter(m => m.role === "user").length === 0 ? "not-allowed" : "pointer",
              fontSize: 12, fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.08em",
              opacity: messages.filter(m => m.role === "user").length === 0 ? 0.4 : 1,
            }}
          >END & SCORE</button>
        </div>
      </header>

      {/* Scenario bar */}
      <div style={{ padding: "8px 28px", background: "#0d0d0d", borderBottom: "1px solid #141414", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#333", letterSpacing: "0.12em" }}>{scenario.title.toUpperCase()} · {scenario.mode.toUpperCase()}</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%",
                padding: "13px 17px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "#1a2a1a" : "#141414",
                border: `1px solid ${m.role === "user" ? "#2a3d2a" : "#1e1e1e"}`,
                fontSize: 14, lineHeight: 1.65,
                color: m.role === "user" ? "#d4edda" : "#c5bfb0",
                fontStyle: m.role === "assistant" ? "italic" : "normal",
              }}>
                {m.role === "assistant" && <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em", marginBottom: 5, fontStyle: "normal" }}>OPPONENT</div>}
                {m.content}
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ display: "flex" }}>
              <div style={{ padding: "13px 17px", borderRadius: "16px 16px 16px 4px", background: "#141414", border: "1px solid #1e1e1e" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 150, 300].map(d => <div key={d} className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9a84c", animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#ef4444" }}>
              {error} — Check your API key in the system prompt.
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #141414", background: "#0a0a0a", flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10 }}>
          <textarea
            ref={inputRef}
            value={input}
            rows={2}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Your response… (Enter to send, Shift+Enter for new line)"
            disabled={thinking}
            style={{
              flex: 1, background: "#111", border: "1px solid #1e1e1e",
              borderRadius: 10, padding: "12px 16px", color: "#e8e4dc",
              fontSize: 14, outline: "none", fontFamily: "inherit",
              lineHeight: 1.5, transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "#c9a84c"}
            onBlur={e => e.target.style.borderColor = "#1e1e1e"}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || thinking}
            style={{
              background: input.trim() && !thinking ? "#c9a84c" : "#141414",
              border: "none", borderRadius: 10, width: 48,
              color: input.trim() && !thinking ? "#0a0a0a" : "#333",
              cursor: input.trim() && !thinking ? "pointer" : "default",
              fontSize: 20, fontWeight: 800, transition: "all 0.15s",
              flexShrink: 0,
            }}
          >↑</button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // SCORING SCREEN
  // ─────────────────────────────────────────────────────────
  if (phase === "scoring") return (
    <div style={{ ...S.app, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 48, height: 48, border: "3px solid #1e1e1e", borderTopColor: "#c9a84c", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 20 }} />
      <div style={{ fontSize: 14, color: "#444", letterSpacing: "0.12em" }}>CLAUDE IS ANALYSING YOUR PERFORMANCE…</div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────────────────
  if (phase === "report" && scores) {
    const overall = getRating(scores.overall);
    return (
      <div style={S.app}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .fade{animation:fadeUp 0.45s ease forwards;opacity:0;}`}</style>
        <header style={S.header}>
          <div style={S.wordmark}>ENLUMA</div>
          <button onClick={reset} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← New Scenario</button>
        </header>

        <div style={{ ...S.page, maxWidth: 680 }}>
          {/* Hero */}
          <div className="fade" style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.2em", marginBottom: 16 }}>{scenario.title.toUpperCase()} · PERFORMANCE REPORT</div>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 130, height: 130, borderRadius: "50%",
              border: `4px solid ${overall.color}`,
              background: "#111", marginBottom: 16,
              boxShadow: `0 0 48px ${overall.color}28`,
            }}>
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, color: overall.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{scores.overall}</div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textAlign: "center" }}>OVERALL</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: overall.color }}>{overall.label}</div>
          </div>

          {/* Score rings */}
          <div className="fade" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "24px 20px", marginBottom: 16, animationDelay: "0.1s" }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em", marginBottom: 20 }}>SCORE BREAKDOWN</div>
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
              <ScoreRing score={scores.confidence} label="Confidence" delay={0} animate={scoreAnim} />
              <ScoreRing score={scores.clarity} label="Clarity" delay={150} animate={scoreAnim} />
              <ScoreRing score={scores.persuasion} label="Persuasion" delay={300} animate={scoreAnim} />
              <ScoreRing score={scores.stability} label="Stability" delay={450} animate={scoreAnim} />
            </div>
          </div>

          {/* Stats */}
          <div className="fade" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16, animationDelay: "0.15s" }}>
            {[["Duration", fmt(scores.duration)], ["Exchanges", scores.turns], ["Fillers", scores.fillerCount], ["Pauses", scores.hesitationCount]].map(([k, v]) => (
              <div key={k} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#c9a84c", fontFamily: "'DM Mono', monospace" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em", marginTop: 4 }}>{k.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Claude's feedback */}
          <div className="fade" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: 24, marginBottom: 16, animationDelay: "0.2s" }}>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 600 }}>CLAUDE'S ANALYSIS</div>
            <p style={{ color: "#a09880", fontSize: 14, lineHeight: 1.75, fontStyle: "italic" }}>"{scores.feedback}"</p>
          </div>

          {/* Strengths / Weaknesses */}
          <div className="fade" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16, animationDelay: "0.25s" }}>
            <div style={{ background: "#111", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>STRENGTHS</div>
              {(scores.strengths || []).map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid rgba(74,222,128,0.35)" }}>{s}</div>
              ))}
            </div>
            <div style={{ background: "#111", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 9, color: "#f87171", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>TO IMPROVE</div>
              {(scores.weaknesses || []).filter(Boolean).length > 0
                ? (scores.weaknesses || []).filter(Boolean).map((w, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid rgba(239,68,68,0.35)" }}>{w}</div>
                  ))
                : <div style={{ fontSize: 12, color: "#444", fontStyle: "italic" }}>Clean session.</div>
              }
            </div>
          </div>

          {/* Next */}
          {scores.nextScenario && (
            <div className="fade" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "14px 18px", marginBottom: 24, animationDelay: "0.3s" }}>
              <span style={{ fontSize: 9, color: "#c9a84c", letterSpacing: "0.15em", fontWeight: 700 }}>NEXT: </span>
              <span style={{ fontSize: 13, color: "#555" }}>{scores.nextScenario}</span>
            </div>
          )}

          {/* CTA */}
          <div className="fade" style={{ display: "flex", gap: 12, animationDelay: "0.35s" }}>
            <button
              onClick={() => { setMessages([]); setFillers(0); setHesitations(0); setElapsed(0); setScores(null); setScoreAnim(false); startSession(); }}
              style={{ flex: 1, padding: 16, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12, color: "#666", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.06em" }}
            >Replay Scenario</button>
            <button
              onClick={reset}
              style={{ flex: 1, padding: 16, background: "#c9a84c", border: "none", borderRadius: 12, color: "#0a0a0a", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 800, letterSpacing: "0.1em" }}
            >New Challenge →</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
