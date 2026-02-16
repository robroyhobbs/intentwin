"use client";

import { Component, type ReactNode } from "react";
import { captureError } from "@/lib/observability/error-tracking";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to show when an error occurs */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Label for identifying which boundary caught the error */
  boundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — Catches rendering errors in child components
 * and displays a fallback UI instead of crashing the entire page.
 *
 * Automatically reports errors to the error tracking service (Sentry-ready).
 *
 * Usage:
 *   <ErrorBoundary boundary="proposal-editor" fallback={<EditorError />}>
 *     <ProposalEditor />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error tracking
    captureError(error, {
      severity: "error",
      tags: {
        boundary: this.props.boundary || "unknown",
        component: "ErrorBoundary",
      },
      context: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-md dark:border-red-800 dark:bg-red-950">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A lightweight inline error boundary for non-critical sections.
 * Shows a minimal error indicator instead of the full error card.
 */
export class InlineErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    captureError(error, {
      severity: "warning",
      tags: {
        boundary: this.props.label || "inline",
        component: "InlineErrorBoundary",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-red-500 p-2">
          Failed to load{this.props.label ? ` ${this.props.label}` : ""}.{" "}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="underline hover:text-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
