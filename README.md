# AI Workplace Productivity Assistant – Momentum AI

A modern AI-powered workplace productivity platform designed to help professionals streamline everyday work through meeting summarization, AI-assisted task planning, and workplace communication.

Built as a portfolio project using **Lovable** for AI-assisted development, Momentum AI combines a modern SaaS interface with live AI capabilities and connected productivity workflows.

---

# Project Overview

The objective of this project was to design and build an enterprise-style productivity platform that demonstrates how Artificial Intelligence can support workplace efficiency.

Rather than focusing solely on generating code, this project emphasized:

- Requirements gathering and refinement
- Prompt engineering
- User experience design
- Workflow integration
- Functional testing
- Debugging and troubleshooting
- State management and persistence
- AI integration
- Iterative development and improvement

The application evolved through multiple development and testing cycles, transforming an initial prototype into a more functional and polished productivity platform.

---

# Features

## 🤖 AI Meeting Notes Summarizer

Generates structured summaries from meeting transcripts using live AI.

### Features

- Executive Summary
- Meeting Objective
- Participants
- Key Discussion Points
- Decisions Made
- Action Items
- Risks and Concerns
- Next Meeting Detection

The summarizer is designed to extract relevant information from the supplied transcript while avoiding unsupported details.

Meeting action items can be sent directly to the Task Planner, helping users turn meeting discussions into actionable work.

---

## 📋 AI Task Planner

Helps users organise tasks using AI-assisted prioritisation and scheduling.

### Features

- Eisenhower Matrix prioritisation
- AI-generated work schedules
- Time-blocking suggestions
- Due date management
- Priority indicators
- Calendar date picker
- Task categorisation
- Estimated task duration

Users can create their own tasks or import action items from meeting summaries, connecting planning with meeting outcomes.

---

## 💬 AI Workplace Assistant

An AI assistant designed to support professional communication and everyday workplace tasks.

### Supports

- Drafting and replying to emails
- Professional rewriting
- Report improvement
- Meeting agenda creation
- Document summarisation
- Brainstorming
- Workplace-related questions

Responses are generated dynamically based on user input, with conversation history passed to the AI to maintain context.

---

## 📊 Dashboard

Provides an overview of user productivity and recent activity.

### Displays

- AI usage statistics
- Meeting summaries created
- Task plans generated
- AI chat history
- Recent activity

Authenticated users see their own activity and statistics from persistent application data. Guest users see clearly labelled sample activity to demonstrate the interface.

---

## 📚 Library

A centralised workspace for managing saved content.

### Includes

- Meeting summaries
- Task plans
- AI conversations

Saved items support actions such as:

- Opening
- Editing
- Renaming
- Deleting
- Duplicating
- Filtering
- Searching

The Library helps users return to previously generated content instead of losing it when navigating between features.

---

## 🔐 Authentication

Supports:

- Sign Up
- Log In
- Guest Mode
- Password Recovery
- Email Verification

Authenticated users have their own workspace, with session restoration supporting continuity when returning to the application.

---

# Workflow Integration

The application was designed to connect features rather than treat them as separate tools.

### Connected Workflow: Meeting Summary → Task Planner

The summarizer identifies relevant meeting information, including:

- Action items
- Assigned owners
- Deadlines
- Next meeting details

Users can then:

- Add selected action items to the Task Planner
- Import multiple tasks
- Create reminders
- Generate meeting preparation checklists

This workflow demonstrates how meeting information can be transformed into practical next steps.

---

# User Experience

Momentum AI follows a modern SaaS design approach, with an emphasis on usability and consistency.

### Includes

- Responsive interface
- Dashboard layout
- Sidebar navigation
- Card-based design
- Loading indicators
- Empty states
- Success notifications
- Error handling
- Smooth transitions
- Consistent navigation between features

Additional development focused on preserving user progress, improving session restoration, and making saved content accessible across the application.

---

# AI Integration

Momentum AI uses the **Lovable AI Gateway** to generate dynamic AI responses using the **Google Gemini 3 Flash Preview** model.

The application uses an OpenAI-compatible chat completions format through the gateway. It does not currently make direct calls to the official OpenAI Responses API.

### AI-Powered Features

- **Meeting Notes Summarizer:** Analyses meeting transcripts and generates structured summaries, decisions, action items, and other relevant details.
- **AI Task Planner:** Classifies tasks using the Eisenhower Matrix and generates prioritisation and scheduling suggestions.
- **AI Workplace Assistant:** Generates workplace communication and answers questions while maintaining conversation context.

### Implementation

- Server-side AI requests using TanStack Start server functions
- Server-only environment variable for gateway authentication
- Structured response validation using Zod schemas
- JSON parsing and formatting safeguards
- Loading indicators and user-facing error messages
- Retry logic for transient network failures and invalid AI responses
- Graceful error handling without substituting fabricated AI outputs when generation fails

API credentials are handled on the server rather than exposed in frontend code.

---

# Development Journey

## Phase 1 – Initial Prototype

The first version established the application's core structure and interface.

### Initial Features

- Dashboard
- Meeting Notes Summarizer
- Task Planner
- AI Workplace Assistant
- Modern SaaS interface

Early testing revealed that some outputs relied on placeholder content and that several features needed more functional integration.

## Phase 2 – Prompt Engineering and AI Improvements

Development focused on improving AI outputs and replacing unrelated or hardcoded responses with live generation.

### Improvements

- Refined AI prompts
- Structured AI outputs
- Improved response formatting
- Live AI generation through the Lovable AI Gateway
- Guest mode support
- Authentication improvements
- Response validation and parsing safeguards
- Error handling and retry logic

Testing with different meeting transcripts helped identify cases where generated summaries did not accurately reflect the supplied information.

## Phase 3 – Workflow Integration

The focus shifted towards making the application's features work together.

### Improvements

- Meeting Summary → Task Planner integration
- Persistent Library content
- Dashboard activity updates
- Improved task management
- More consistent navigation
- State persistence across features
- Improved automatic saving

## Phase 4 – Quality Assurance and Debugging

Testing revealed issues involving AI response parsing, automatic saving, authentication callbacks, and application initialisation.

### Testing Areas

- Short and long meeting transcripts
- AI-generated summaries
- Workplace assistant prompts
- Task creation and planning
- Authentication and session restoration
- Navigation between pages
- Library functionality
- Dashboard behaviour
- Automatic saving
- Browser refresh and route loading

The testing process involved reproducing issues, examining error messages, refining implementation requirements, and verifying fixes.

---

# Bugs Identified and Improvements

## 1. AI Placeholder Responses

**Problem**

Meeting summaries and chat responses sometimes returned unrelated, hardcoded content instead of reflecting the user's input.

**Solution**

Replaced hardcoded AI responses with live generation through the Lovable AI Gateway. Added structured prompts, response validation, and error handling to improve relevance and reliability.

## 2. Hardcoded Demo User

**Problem**

The application displayed a fixed example user instead of properly supporting different users.

**Solution**

Introduced guest access and authentication to support different user experiences.

## 3. Task Planner

**Problem**

Preloaded example tasks made it difficult to distinguish sample content from tasks created by the user.

**Solution**

Moved examples into input placeholders and improved task creation so users can organise their own work.

## 4. Library

**Problem**

Saved items were initially static and could not be reliably reopened or managed.

**Solution**

Improved Library functionality to support saving, reopening, editing, renaming, duplicating, searching, filtering, and deleting content.

## 5. Dashboard

**Problem**

The dashboard displayed permanent sample activity rather than reflecting changes made within the application.

**Solution**

Connected dashboard activity and statistics to user-specific application data, while retaining labelled sample activity for guest users.

## 6. State Management

**Problem**

Navigating between pages could cause progress in Meeting Notes, Task Planner, and AI Chat to be lost.

**Solution**

Improved state persistence and restoration so users can move between features while retaining their work.

## 7. Automatic Saving

**Problem**

Frequent unsaved-changes warnings interrupted the user experience and raised concerns about losing work.

**Solution**

Improved background saving and persistence to reduce unnecessary warnings and preserve user progress.

## 8. AI Response Parsing

**Problem**

Long meeting transcripts occasionally produced malformed responses that triggered JSON parsing errors.

**Solution**

Improved JSON extraction, response validation, and retry handling to make AI-generated outputs more reliable and failures easier to manage.

## 9. Authentication and Session Restoration

**Problem**

Email verification could occasionally redirect to an expired or invalid callback URL, even after account creation.

**Solution**

Refined authentication callback handling and session restoration to improve the sign-in experience.

## 10. Browser Refresh and Sidebar Context

**Problem**

Refreshing an authenticated page could trigger a generic application error. The browser console identified a `useSidebar must be used within a SidebarProvider` error, indicating that a component was accessing sidebar context before the required provider was available.

**Solution**

Refined the application initialisation and provider hierarchy to ensure sidebar-dependent components render within the required context. This resolved the reported refresh issue and improved application loading after a full browser refresh.

---

# Technologies Used

- **Lovable** – AI-assisted application development
- **React** – User interface development
- **TypeScript** – Type-safe application code
- **Tailwind CSS** – Styling and responsive layouts
- **TanStack Start** – Server functions and backend request handling
- **Supabase Authentication** – User authentication and sessions
- **Lovable AI Gateway** – AI model access
- **Google Gemini 3 Flash Preview** – AI response generation
- **Zod** – Structured response validation

---

# Skills Demonstrated

This project provided practical opportunities to develop and demonstrate skills in:

- Business analysis and requirements refinement
- Prompt engineering
- AI-assisted application development
- Workflow design and integration
- User experience design
- Functional testing and quality assurance
- Debugging and troubleshooting
- State management and persistence
- Authentication and session handling
- Error handling and response validation
- Iterative software development
- Translating user needs into functional requirements

---

# Future Improvements

Potential enhancements include:

- Username display and profile customisation
- Google Calendar integration
- Microsoft Outlook integration
- File uploads and document processing
- Voice transcription and meeting capture
- Team collaboration and shared workspaces
- Role-based permissions
- More detailed productivity analytics
- Mobile application support
- Further testing across routes, devices, and authentication scenarios

---

# Disclaimer

> **AI-generated content should always be reviewed by a human before being used for business decisions or official communication.**
