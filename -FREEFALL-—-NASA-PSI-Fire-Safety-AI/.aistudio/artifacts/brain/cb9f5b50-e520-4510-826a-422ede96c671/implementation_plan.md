# Friendly Astronaut AI Chatbot ("AstroChat")

Replace the complex "NASA Hybrid AI & UI Action Agent" entirely with a focused, approachable, and friendly Astronaut AI Chatbot ("AstroChat") that answers everyday and curious questions using Gemini AI (with search grounding), leaving all other app components (ML Predictor, 2D Phase Map, 48 Verified PSI runs, NTRS Vault, Dossier Modal, AI Settings) completely untouched.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Removal of Hybrid AI / Action Agent**: We are completely eliminating the complex auto-dossier navigation actions, intent routing, and rigid flight-safety engineer persona from the chatbot.
> - **Single Friendly Chatbot**: The floating assistant button and window now exclusively host the **Friendly Astronaut Companion ("AstroChat")**.
> - **Gemini Powered**: Uses Gemini AI with Google Search Grounding to provide warm, approachable, easy-to-understand answers to normal everyday questions (e.g. how fire, food, sleep, coffee, and daily life work in microgravity), even if generation takes a few moments.
> - **Rest Untouched**: The ML Predictor, 2D Phase Map, 48 Verified NASA PSI runs, CSV export, NTRS Vault, and Dossier inspection modal remain 100% active and untouched.

---

## 1. Overview & Core Concept

- **Persona**: **AstroChat** — an approachable, warm, and friendly Astronaut Guide.
- **Conversational Style**:
  - Conversational, enthusiastic, and warm.
  - Answers everyday questions simply using relatable metaphors (e.g., surface tension like a water balloon, hot air convection, sleeping in a sleeping bag tied to the wall).
  - Patiently answers general science, human spaceflight, and curiosities without differential equations or bureaucratic walls.
- **Floating Launcher**:
  - A friendly astronaut launcher button in the bottom right corner labeled: `🧑‍🚀 Chat with an Astronaut`.

---

## 2. User Experience & Visual Design

### Chatbot Window (`AstroChatModal` / `SafetyAIAssistant`)
- **Header**:
  - Avatar: Friendly Astronaut icon `🧑‍🚀`.
  - Title: **AstroChat · Astronaut Companion**
  - Subtitle: *Ask me anything about living, working, and science in space!*
  - Controls: Clear chat, minimize/expand, and close.
- **Starter Chips (Normal Everyday Questions)**:
  - 🕯️ *"What happens if you light a match or candle in space?"*
  - ☕ *"How do astronauts drink coffee without a mug?"*
  - 😴 *"How do you sleep when there is no gravity?"*
  - 👃 *"Can you smell space after a spacewalk?"*
  - 🚨 *"What does a fire alarm sound like on the ISS?"*
  - 🌍 *"What does sunrise look like every 90 minutes?"*
- **Message Feed**:
  - Clean conversational speech bubbles with timestamps.
  - Formatted markdown (bolding, friendly bullet lists, simple terms).
  - Search Grounding sources displayed cleanly when relevant.
- **Input Area**:
  - Clean text field: *"Ask an astronaut anything..."*
  - Send button with loading spinner when Gemini is formulating responses.

---

## 3. Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│               AstroChat / Friendly AI                  │
│       (Plain English, conversational UI)               │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               POST /api/safety-assistant/chat          │
│  - messages (multi-turn history)                       │
│  - userClientKey (if user set a custom key)            │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  [ Gemini 3.8 Flash + Search ]  [ Warm Astronaut Fallback ]
  (Empathetic, clear physics)    (Pre-composed friendly answers)
```

### System Instruction (`server.ts`):
```text
You are Astro Alex, a friendly, enthusiastic NASA Astronaut Guide aboard the International Space Station.
You love talking to students, curious people, and visitors about what it's really like to live and do science in microgravity.
Guidelines:
1. Be warm, approachable, conversational, and encouraging!
2. Answer everyday questions in plain, intuitive English using vivid analogies (e.g., drinking coffee through a capillary cup, how a flame becomes a round blue ghost, sleeping strapped to the wall).
3. If they ask about fire safety or physics, explain the real science simply and clearly without intimidating math.
4. Keep the conversation natural, friendly, and engaging!
```

---

## 4. Implementation Plan

1. **Update `server.ts`**:
   - Streamline `/api/safety-assistant/chat` to use the friendly Astronaut Guide system instruction exclusively.
   - Keep `gemini-3.8-flash` with Google Search grounding and robust rate-limit/offline fallbacks.

2. **Refactor `src/components/SafetyAIAssistant.tsx`**:
   - Strip out `detectAgentTopicIntent`, action banners, and forced tab switches.
   - Rebrand the component visually as **AstroChat · Astronaut Companion**.
   - Provide clean, relatable starter prompt chips.

3. **Verify Everything Else is Untouched**:
   - Confirm ML Predictor, 2D Phase Map, 48 Verified PSI runs, NTRS Vault, and DossierModal remain intact.
   - Run `compile_applet` and `lint_applet` simultaneously.
