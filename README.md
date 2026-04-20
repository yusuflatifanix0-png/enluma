# ENLUMA
### Communication Intelligence Platform
**Built with Claude Opus 4.7 — Anthropic Hackathon 2026**

> *"We do not need more ways to learn. We need better ways to be."*

---

## What Is Enluma?

Enluma is a **Communication Intelligence Platform** that trains people for high-stakes conversations before they happen in the real world.

It is not a language learning app. It is not a chatbot wrapper.

It is a performance system that uses **Claude Opus 4.7 in two simultaneous roles**:

1. **AI Opponent** — Claude plays a fully in-character adversary (interviewer, negotiator, angry client, skeptical investor) that responds dynamically to exactly what the user says. No scripts. No predetermined paths.

2. **Performance Evaluator** — After the session, Claude reads the full transcript and scores the user across four dimensions with written coaching feedback specific to their actual responses.

---

## The Problem It Solves

The global communication training market is $80B+. Every platform in it teaches *content* — vocabulary, grammar, theory. None of them train *performance* — what happens when you're under real pressure.

When people enter high-stakes conversations, the prefrontal cortex yields to the amygdala. They hesitate. They fill silence with filler words. They lose the vocabulary they studied. Legacy platforms have no answer for this.

**Enluma's answer:** deliberate stress training through AI-powered adversarial simulation. You fail repeatedly in a safe environment until the anxiety disappears and the performance becomes automatic.

---

## How Claude Powers It

Claude is not optional in this product. It is the product.

### Role 1: The Opponent
Each scenario gives Claude a system prompt that defines a specific character — a sharp hiring manager, a tough negotiator, a furious client. Claude responds in-character to exactly what the user says, using pressure, follow-up questions, and pushback dynamically. The experience is impossible to replicate with scripted responses or weaker models.

### Role 2: The Evaluator
At session end, Claude receives the full transcript plus behavioural metrics (filler word count, hesitation count, response times) and returns a structured JSON score across:

- **Confidence Index** — directness, no hedging, decisive language
- **Clarity Score** — structure, precision, avoids rambling
- **Persuasion Rate** — moves toward goal, logical framing
- **Emotional Stability** — consistent under pressure

Plus: specific strengths, specific weaknesses, and written coaching feedback tied to what the user *actually said* — not generic advice.

---

## Scenarios (v1)

| Scenario | Difficulty | Cognitive Mode |
|----------|-----------|----------------|
| Senior Job Interview | Hard | Confident Speaker |
| Salary Negotiation | Hard | Elite Negotiator |
| Angry Client Call | Extreme | Calm & Controlled |
| Investor Pitch | Extreme | Confident Speaker |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Next.js ready) |
| AI Opponent | Claude Opus 4.7 via Anthropic API |
| Scoring Engine | Claude Opus 4.7 (JSON structured output) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

**API Model:** `claude-opus-4-7`
**Two API calls per session:** one streaming (opponent responses) + one scored evaluation at end

---

## Running the Demo

### Option 1 — Claude.ai Artifacts (Instant)
1. Open `Enluma_Hackathon_Demo.jsx`
2. Paste into Claude.ai as an artifact
3. Add your Anthropic API key to the system
4. Run instantly in browser — no setup needed

### Option 2 — Local Next.js
```bash
npx create-next-app@latest enluma --typescript --tailwind --app
cd enluma
npm install
# Add your API key to .env.local
# OPENAI_API_KEY=your_key (or route through Next.js API)
npm run dev
```

---

## Project Structure

```
enluma/
├── Enluma_Hackathon_Demo.jsx     # Complete working demo
├── enluma_architecture.md        # Full technical architecture + DB schema
├── Enluma_White_Paper.docx       # "The Communication Intelligence Gap" white paper
└── README.md
```

---

## The Bigger Vision

Enluma v1 is the Scenario Forge — the proof that this works.

The full platform roadmap:

- **Phase A** (now) — Scenario Forge + performance scoring + creator tools
- **Phase B** — Live Co-Pilot Mode (Claude whispers suggestions during real calls)
- **Phase C** — Enterprise communication readiness dashboards
- **Phase D** — API/SDK for third-party integration + certification layer

The defensibility is not the features. It is the **Persistent Communication Graph** — a living map of each user's hesitation patterns, vocabulary depth, and confidence trajectory that deepens with every session. No competitor can replicate years of this data.

---

## The Name

**Enluma** is a synthesis of two ancient traditions:

- *Enuma Elish* — the Babylonian creation epic, the oldest written story in human history, born in Mesopotamia where writing itself was invented
- *Luma* — meaning light across Persian, Arabic, and Latin traditions

Enluma means: **the light of creation through language.**

No technology brand has ever seriously claimed this cultural territory. That's intentional.

---

## Built For

**Hackathon:** Built with Opus 4.7 — Cerebral Valley x Anthropic, April 2026

**By:** Yusuf Latifani

**Contact:** Available for demo, questions, and collaboration.

---

*"Turn every conversation into a performance advantage."*
