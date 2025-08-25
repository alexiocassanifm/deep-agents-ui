# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js React UI for "Deep Agents" - generic AI agents that handle tasks of varying complexity. It serves as a frontend interface for the LangChain `deep-agents` package, providing a chat interface with real-time streaming, task management, and file viewing capabilities.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Configuration

The application requires environment variables in `.env.local`:

**Local LangGraph Server:**
```
NEXT_PUBLIC_DEPLOYMENT_URL="http://127.0.0.1:2024"
NEXT_PUBLIC_AGENT_ID=<agent-id-from-langgraph.json>
```

**Production LangGraph Deployment:**
```
NEXT_PUBLIC_DEPLOYMENT_URL="your-agent-server-url"
NEXT_PUBLIC_AGENT_ID=<agent-id-from-langgraph.json>
NEXT_PUBLIC_LANGSMITH_API_KEY=<langsmith-api-key>
```

## Architecture

### Core Technologies
- Next.js 15.4.6 with React 19
- TypeScript with strict mode
- SCSS modules for styling
- LangChain LangGraph SDK for agent communication
- Radix UI components with Tailwind CSS
- Real-time streaming with WebSocket-like connections

### Key Architectural Patterns

**State Management:**
- Main app state in `src/app/page.tsx` manages threads, todos, files, and UI state
- `useChat` hook (`src/app/hooks/useChat.ts`) handles LangGraph streaming and message management
- Real-time updates via `onUpdateEvent` callbacks for todos and files
- Thread state persistence through LangGraph server

**Component Structure:**
- `ChatInterface` - Main chat UI with message streaming
- `TasksFilesSidebar` - Displays todo items and generated files
- `SubAgentPanel` - Shows sub-agent execution details
- `FileViewDialog` - Modal for viewing file contents
- `ThreadHistorySidebar` - Thread management and history

**Data Flow:**
- Messages stream through LangGraph SDK with real-time updates
- Thread state (todos, files) fetched from LangGraph server on thread change
- Optimistic updates for immediate UI feedback
- State updates propagated through callback props

### Authentication
Simple token-based auth via `AuthProvider` using `NEXT_PUBLIC_LANGSMITH_API_KEY` or fallback demo token.

### LangGraph Integration
- Client creation in `src/lib/client.ts` with deployment configuration
- Streaming via `@langchain/langgraph-sdk/react` useStream hook
- Thread state management through LangGraph threads API
- Recursion limit set to 100 for agent execution

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- Next.js plugin for TypeScript integration

## Component Patterns

- SCSS modules for component-scoped styling
- React.memo for performance optimization on heavy components
- Custom hooks for complex state management
- Radix UI primitives with custom styling
- Error boundaries and loading states throughout