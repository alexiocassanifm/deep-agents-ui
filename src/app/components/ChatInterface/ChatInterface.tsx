"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, LoaderCircle, SquarePen, History, X, AlertCircle } from "lucide-react";
import { ChatMessage } from "../ChatMessage/ChatMessage";
import { ThreadHistorySidebar } from "../ThreadHistorySidebar/ThreadHistorySidebar";
// import { InterruptDialog } from "../InterruptDialog/InterruptDialog"; // No longer needed - using main textbox
import type { SubAgent, TodoItem, ToolCall } from "../../types/types";
import { useChat } from "../../hooks/useChat";
import styles from "./ChatInterface.module.scss";
import { Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "../../utils/utils";

interface ChatInterfaceProps {
  threadId: string | null;
  selectedSubAgent: SubAgent | null;
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
  ) => void;
  onSelectSubAgent: (subAgent: SubAgent) => void;
  onTodosUpdate: (todos: TodoItem[]) => void;
  onFilesUpdate: (files: Record<string, string>) => void;
  onNewThread: () => void;
  isLoadingThreadState: boolean;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(
  ({
    threadId,
    selectedSubAgent,
    setThreadId,
    onSelectSubAgent,
    onTodosUpdate,
    onFilesUpdate,
    onNewThread,
    isLoadingThreadState,
  }) => {
    // Default message for new conversations
    const defaultMessage = "creami un piano di sviluppo (non voglio gantt, stime ma soluzioni tecniche) per implementare US-2025-1258: Introduzione delle sessioni di lavoro in Agile Studio e Requirement Studio del progetto fairmind studio";
    
    const [input, setInput] = useState(defaultMessage);
    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading, interrupt, sendMessage, stopStream, resumeWithValue } = useChat(
      threadId,
      setThreadId,
      onTodosUpdate,
      onFilesUpdate,
    );

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Reset to default message when starting a new thread
    useEffect(() => {
      if (!threadId && messages.length === 0) {
        setInput(defaultMessage);
      }
    }, [threadId, messages.length, defaultMessage]);

    const handleSubmit = useCallback(
      (e: FormEvent) => {
        e.preventDefault();
        const messageText = input.trim();
        if (!messageText) return;
        
        if (interrupt) {
          // If there's an interrupt, send as response to the interrupt
          resumeWithValue(messageText);
        } else if (!isLoading) {
          // Otherwise send as normal message
          sendMessage(messageText);
        }
        setInput("");
      },
      [input, isLoading, interrupt, sendMessage, resumeWithValue],
    );

    // Handle resume from interrupt - no longer needed as we use the main input
    // const handleInterruptResume = useCallback(
    //   (value: string) => {
    //     resumeWithValue(value);
    //   },
    //   [resumeWithValue],
    // );

    const handleNewThread = useCallback(() => {
      // Cancel any ongoing thread when creating new thread
      if (isLoading) {
        stopStream();
      }
      setIsThreadHistoryOpen(false);
      setInput(defaultMessage); // Reset to default message for new thread
      onNewThread();
    }, [isLoading, stopStream, onNewThread, defaultMessage]);

    const handleThreadSelect = useCallback(
      (id: string) => {
        setThreadId(id);
        setIsThreadHistoryOpen(false);
      },
      [setThreadId],
    );

    const toggleThreadHistory = useCallback(() => {
      setIsThreadHistoryOpen((prev) => !prev);
    }, []);

    const hasMessages = messages.length > 0;

    const processedMessages = useMemo(() => {
      /* 
    1. Loop through all messages
    2. For each AI message, add the AI message, and any tool calls to the messageMap
    3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
    */
      const messageMap = new Map<string, any>();
      messages.forEach((message: Message) => {
        if (message.type === "ai") {
          const toolCallsInMessage: any[] = [];
          if (
            message.additional_kwargs?.tool_calls &&
            Array.isArray(message.additional_kwargs.tool_calls)
          ) {
            toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
          } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
            toolCallsInMessage.push(
              ...message.tool_calls.filter(
                (toolCall: any) => toolCall.name !== "",
              ),
            );
          } else if (Array.isArray(message.content)) {
            const toolUseBlocks = message.content.filter(
              (block: any) => block.type === "tool_use",
            );
            toolCallsInMessage.push(...toolUseBlocks);
          }
          const toolCallsWithStatus = toolCallsInMessage.map(
            (toolCall: any) => {
              const name =
                toolCall.function?.name ||
                toolCall.name ||
                toolCall.type ||
                "unknown";
              const args =
                toolCall.function?.arguments ||
                toolCall.args ||
                toolCall.input ||
                {};
              return {
                id: toolCall.id || `tool-${Math.random()}`,
                name,
                args,
                status: "pending" as const,
              } as ToolCall;
            },
          );
          messageMap.set(message.id!, {
            message,
            toolCalls: toolCallsWithStatus,
          });
        } else if (message.type === "tool") {
          const toolCallId = message.tool_call_id;
          if (!toolCallId) {
            return;
          }
          for (const [, data] of messageMap.entries()) {
            const toolCallIndex = data.toolCalls.findIndex(
              (tc: any) => tc.id === toolCallId,
            );
            if (toolCallIndex === -1) {
              continue;
            }
            data.toolCalls[toolCallIndex] = {
              ...data.toolCalls[toolCallIndex],
              status: "completed" as const,
              // TODO: Make this nicer
              result: extractStringFromMessageContent(message),
            };
            break;
          }
        } else if (message.type === "human") {
          messageMap.set(message.id!, {
            message,
            toolCalls: [],
          });
        }
      });
      const processedArray = Array.from(messageMap.values());
      return processedArray.map((data, index) => {
        const prevMessage =
          index > 0 ? processedArray[index - 1].message : null;
        return {
          ...data,
          showAvatar: data.message.type !== prevMessage?.type,
        };
      });
    }, [messages]);

    return (
      <>
        <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Bot className={styles.logo} />
            <h1 className={styles.title}>Deep Agents</h1>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewThread}
              disabled={!hasMessages}
            >
              <SquarePen size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleThreadHistory}>
              <History size={20} />
            </Button>
          </div>
        </div>
        <div className={styles.content}>
          <ThreadHistorySidebar
            open={isThreadHistoryOpen}
            setOpen={setIsThreadHistoryOpen}
            currentThreadId={threadId}
            onThreadSelect={handleThreadSelect}
          />
          <div className={styles.messagesContainer}>
            {!hasMessages && !isLoading && !isLoadingThreadState && (
              <div className={styles.emptyState}>
                <Bot size={48} className={styles.emptyIcon} />
                <h2>Start a conversation or select a thread from history</h2>
              </div>
            )}
            {isLoadingThreadState && (
              <div className={styles.threadLoadingState}>
                <LoaderCircle className={styles.threadLoadingSpinner} />
              </div>
            )}
            <div className={styles.messagesList}>
              {processedMessages.map((data) => (
                <ChatMessage
                  key={data.message.id}
                  message={data.message}
                  toolCalls={data.toolCalls}
                  showAvatar={data.showAvatar}
                  onSelectSubAgent={onSelectSubAgent}
                  selectedSubAgent={selectedSubAgent}
                />
              ))}
              {isLoading && (
                <div className={styles.loadingMessage}>
                  <LoaderCircle className={styles.spinner} />
                  <span>Working...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        {/* Interrupt Banner - shows the question when agent needs input */}
        {interrupt && (
          <div className={styles.interruptBanner}>
            <div className={styles.interruptHeader}>
              <AlertCircle className={styles.interruptIcon} />
              <span className={styles.interruptTitle}>Agent needs your input:</span>
            </div>
            <div className={styles.interruptQuestion}>
              {typeof interrupt === "string"
                ? interrupt
                : interrupt?.value || interrupt?.message || "Please provide input:"}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={interrupt ? "Type your response here..." : "Type your message..."}
            disabled={isLoading && !interrupt} // Only disable during loading if NOT interrupt
            className={styles.input}
            autoFocus={!!interrupt} // Auto-focus when interrupt is active
          />
          {isLoading && !interrupt ? (
            <Button
              type="button"
              onClick={stopStream}
              className={styles.stopButton}
            >
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              className={styles.sendButton}
            >
              <Send size={16} />
            </Button>
          )}
        </form>
        </div>
      </>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
