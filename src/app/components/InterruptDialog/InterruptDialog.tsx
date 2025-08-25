"use client";

import React, { useState, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Send, X } from "lucide-react";
import styles from "./InterruptDialog.module.scss";

interface InterruptDialogProps {
  interrupt: any | null;
  onResume: (value: string) => void;
  onCancel?: () => void;
}

export const InterruptDialog = React.memo<InterruptDialogProps>(
  ({ interrupt, onResume, onCancel }) => {
    const [response, setResponse] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(
      async (e: FormEvent) => {
        e.preventDefault();
        if (!response.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
          onResume(response.trim());
          setResponse(""); // Clear input after submission
        } finally {
          setIsSubmitting(false);
        }
      },
      [response, isSubmitting, onResume]
    );

    const handleCancel = useCallback(() => {
      if (onCancel) {
        onCancel();
      }
    }, [onCancel]);

    // Don't render if no interrupt
    if (!interrupt) return null;

    // Extract the question/message from the interrupt
    // The interrupt value could be a string or an object
    const question =
      typeof interrupt === "string"
        ? interrupt
        : interrupt?.value || interrupt?.message || "Please provide input:";

    return (
      <div className={styles.overlay}>
        <div className={styles.dialog}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <AlertCircle className={styles.icon} />
              <h3 className={styles.title}>Agent Needs Your Input</h3>
            </div>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className={styles.closeButton}
                disabled={isSubmitting}
              >
                <X size={16} />
              </Button>
            )}
          </div>

          <div className={styles.content}>
            <p className={styles.question}>{question}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <Input
                  type="text"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  className={styles.input}
                  disabled={isSubmitting}
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!response.trim() || isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? (
                    <span className={styles.loadingText}>Sending...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className={styles.hint}>
              The agent is waiting for your response to continue...
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InterruptDialog.displayName = "InterruptDialog";