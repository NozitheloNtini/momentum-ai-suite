# Momentum AI

A modern, responsive SaaS web application that helps professionals save time by using AI to automate common workplace tasks. Momentum AI feels like a polished enterprise productivity platform — think Notion AI, Microsoft Copilot, or ChatGPT Enterprise.

> **Status:** Interactive prototype with placeholder AI functionality that can easily be connected to a real AI API.

---

## ✨ Features

### 📝 Meeting Notes Summarizer
Paste raw meeting notes or a transcript and get a structured, executive-ready summary:
- Executive summary
- Key discussion points
- Action items with owner, priority, and deadline
- Decisions made
- Risks & follow-ups

### ✅ AI Task Planner
Turn a messy task list into a focused day:
- Eisenhower Matrix classification (Do / Schedule / Delegate / Eliminate)
- Prioritized focus order with rationale
- Time-blocked daily schedule with buffers
- Risk callouts for tight deadlines

### 💬 AI Assistant Chat
A conversational assistant for everyday workplace writing:
- Persistent chat history
- Auto-scroll and typing indicators
- Suggested prompts to get started
- Helpful for drafting emails, summaries, agendas, and status updates

### ⚙️ Settings
- Profile preferences
- Placeholder AI API integration settings — ready to wire up to a real provider

---

## 🎨 Design

- Clean, professional blue / white / gray palette
- Sidebar + top-bar dashboard layout
- Rounded corners, consistent spacing, and subtle micro-interactions
- Fully responsive — desktop, tablet, and mobile
- Built with shadcn/ui components and Tailwind CSS v4

---

## 🛠 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7)
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui + Radix
- **Language:** TypeScript
- **Package Manager:** Bun

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (or Node.js 20+)

### Install
```bash
bun install
```

### Run the dev server
```bash
bun run dev
```

The app will be available at `http://localhost:8080`.

### Build for production
```bash
bun run build
```

---

## 📁 Project Structure

```
src/
├── components/        # Reusable UI (sidebar, top bar, disclaimer, shadcn/ui)
├── hooks/             # Custom React hooks
├── lib/
│   └── mock-ai.ts     # Mock AI service — swap for real LLM calls here
├── routes/            # File-based routes (TanStack Start)
│   ├── __root.tsx     # App shell
│   ├── index.tsx      # Dashboard
│   ├── meeting-notes.tsx
│   ├── task-planner.tsx
│   ├── chat.tsx
│   └── settings.tsx
└── styles.css         # Tailwind v4 theme & tokens
```

---

## 🤖 Connecting a Real AI Provider

All AI logic is centralized in [`src/lib/mock-ai.ts`](src/lib/mock-ai.ts). Each mock function includes an inline prompt spec (role, task, output format) documenting the intended LLM behavior.

To go live, replace the `mock*` functions with real calls (e.g. OpenAI, Anthropic, or the Lovable AI Gateway) — the UI components require no changes.

```ts
// Example: swap mockSummarizeMeeting with a real LLM call
export async function summarizeMeeting(title: string, notes: string) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    body: JSON.stringify({ title, notes }),
  });
  return res.json();
}
```

---

## 📄 License

MIT — free to use, modify, and build on.

---

## 🙌 Acknowledgements

Built with [Lovable](https://lovable.dev).
