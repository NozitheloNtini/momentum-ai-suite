# 🚀 Momentum AI

> An AI-powered workplace productivity platform designed to help professionals streamline meetings, organize tasks, and work more efficiently.

Momentum AI is a modern, responsive SaaS web application that leverages AI to automate common workplace tasks. Inspired by platforms like Notion AI, Microsoft Copilot, and ChatGPT Enterprise, it combines intelligent automation with a clean, intuitive user experience.

> **Status:** Interactive prototype with placeholder AI functionality. The application is architected for seamless integration with real AI providers such as OpenAI, Anthropic, or Google Gemini.

---

# 📖 About

Momentum AI was built to demonstrate how artificial intelligence can enhance workplace productivity through intelligent automation.

The project focuses on:

- AI-assisted meeting documentation
- Intelligent task prioritization
- Workplace AI assistance
- Modern SaaS UI/UX
- Responsive web design
- Clean, scalable architecture
- Future-ready AI integration

It serves as both a portfolio project and a foundation for a production-ready AI productivity platform.

---

# ✨ Features

## 🏠 Smart Onboarding

Momentum AI is designed with a user-friendly onboarding experience.

### Current
- Interactive dashboard
- Demo AI workflows
- Responsive navigation
- Professional SaaS interface

### Planned
- Continue as Guest
- User Sign Up & Login
- Secure authentication with Supabase
- Personalized dashboards
- Persistent user data
- Session management

---

## 📝 Meeting Notes Summarizer

Transform raw meeting notes into structured business documentation.

### Features

- Executive Summary
- Key Discussion Points
- Action Items
- Task Owner
- Priority Level
- Deadlines
- Decisions Made
- Risks & Follow-ups

Designed using structured prompt engineering to generate concise, professional, and actionable outputs.

---

## ✅ AI Task Planner

Convert an overwhelming to-do list into a prioritized action plan.

### Features

- Eisenhower Matrix classification
- Intelligent task prioritization
- Daily scheduling
- Time-blocking recommendations
- Focus order suggestions
- High-risk deadline detection
- Priority badges
- Schedule visualization

---

## 💬 AI Workplace Assistant

A conversational AI assistant built for professional communication.

### Capabilities

- Email drafting
- Email summarization
- Meeting agenda generation
- Report improvement
- Workplace writing assistance
- General productivity support

### UI Features

- Chat history
- Suggested prompts
- Typing indicator
- Auto-scroll
- Clear conversation option

---

## 📊 Dashboard

A centralized productivity dashboard providing quick access to every AI tool.

Includes:

- Meeting Notes card
- AI Task Planner card
- AI Assistant card
- Recent Activity
- Productivity Tips
- AI Usage Statistics (prototype)

---

## ⚙️ Settings

Configure the application experience.

Current options include:

- Profile preferences
- Placeholder AI configuration
- Future AI provider settings

---

# ⚠️ Disclaimer

> **AI-generated content may require human review before being used for business decisions or official communication.**

---

# 🎨 Design

Momentum AI follows modern SaaS design principles.

### Design Highlights

- Clean and minimal interface
- Professional blue, white, and gray color palette
- Sidebar navigation
- Dashboard layout
- Card-based UI
- Rounded corners
- Subtle shadows
- Smooth micro-interactions
- Responsive design for desktop, tablet, and mobile
- Accessible color contrast

Built using **shadcn/ui** and **Tailwind CSS v4**.

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Frontend Framework |
| TanStack Start | Full-stack React Framework |
| TanStack Router | File-based Routing |
| TypeScript | Type Safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI Components |
| Radix UI | Accessible UI Primitives |
| Bun | Package Manager |
| Vite 7 | Build Tool |

---

# 🚀 Getting Started

## Prerequisites

Install one of the following:

- Bun (recommended)
- Node.js 20+

---

## Installation

```bash
bun install
```

---

## Start Development Server

```bash
bun run dev
```

The application will be available at:

```
http://localhost:8080
```

---

## Production Build

```bash
bun run build
```

---

# 📁 Project Structure

```
src/
├── components/
│   ├── Sidebar
│   ├── TopBar
│   ├── Dashboard Cards
│   ├── Disclaimer
│   └── Shared UI Components
│
├── hooks/
│   └── Custom React Hooks
│
├── lib/
│   └── mock-ai.ts
│
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── meeting-notes.tsx
│   ├── task-planner.tsx
│   ├── chat.tsx
│   └── settings.tsx
│
└── styles.css
```

---

# 🤖 AI Architecture

Momentum AI currently uses a mock AI service located in:

```
src/lib/mock-ai.ts
```

Each feature is built around structured prompt engineering, making it easy to replace placeholder logic with real AI providers.

Supported future integrations include:

- OpenAI
- Anthropic Claude
- Google Gemini
- Azure OpenAI
- Lovable AI Gateway

Example:

```ts
export async function summarizeMeeting(title: string, notes: string) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    body: JSON.stringify({ title, notes }),
  });

  return res.json();
}
```

Because the AI layer is isolated, no UI changes are required when switching to a production AI provider.

---

# 🔮 Roadmap

Planned improvements include:

- Guest Mode
- User Authentication (Supabase Auth)
- Personal dashboards
- Persistent cloud storage
- Chat history synchronization
- Calendar integration
- Microsoft Outlook integration
- Microsoft Teams integration
- Google Calendar support
- Export summaries to PDF
- Export meeting notes to Word
- Team collaboration
- Dark Mode
- AI analytics dashboard
- Mobile optimization

---

# 📸 Screenshots

Add screenshots of the application here.

Suggested images:

- Landing Page
- Dashboard
- Meeting Notes Summarizer
- AI Task Planner
- AI Assistant
- Mobile Responsive View

---

# 🎯 Project Goals

This project demonstrates practical skills in:

- Modern React development
- Responsive UI design
- Component-based architecture
- TypeScript
- Prompt engineering
- AI-ready application design
- SaaS product development
- User experience design
- Scalable frontend architecture

---

# 📄 License

This project is licensed under the **MIT License**.

Feel free to use, modify, and build upon it.

---

# 🙌 Acknowledgements

Built with:

- ❤️ Lovable
- React
- TanStack Start
- Tailwind CSS
- shadcn/ui
- Radix UI

---

## ⭐ Future Vision

Momentum AI aims to evolve into a full-featured AI workplace productivity platform where users can securely manage meetings, organize work, collaborate efficiently, and leverage AI to reduce repetitive administrative tasks.

The long-term vision is to deliver a production-ready SaaS experience that combines intelligent automation with an intuitive user interface for modern professionals.
