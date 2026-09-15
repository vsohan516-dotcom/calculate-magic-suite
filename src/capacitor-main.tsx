import "./capacitor-polyfills";
import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { CalculatorApp } from "@/components/calculator/CalculatorApp";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

declare global {
  interface Window {
    /** Painted by the inline watchdog in index.capacitor.html. */
    __lumenBootError?: (title: string, detail: string) => void;
  }
}

/**
 * A crash inside the app used to leave the WebView showing nothing but the
 * #1a1530 background from index.capacitor.html — an unexplainable blank screen.
 * This boundary prints the real message and stack on the device instead, so the
 * cause is readable in a screenshot.
 */
class BootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    window.__lumenBootError?.(
      "App crashed while rendering",
      `${error.stack ?? error.message}
${info.componentStack ?? ""}`,
    );
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 20, color: "#f2eefc", font: "14px/1.55 monospace" }}>
        <h1 style={{ fontSize: 17, color: "#ffd166" }}>App crashed while rendering</h1>
        <pre
          style={{ whiteSpace: "pre-wrap", background: "#2a2244", padding: 12, borderRadius: 8 }}
        >
          {this.state.error.stack ?? this.state.error.message}
        </pre>
        <button
          style={{
            marginTop: 14,
            padding: "10px 16px",
            borderRadius: 8,
            border: 0,
            background: "#7c3aed",
            color: "#fff",
          }}
          onClick={() => location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}

createRoot(root).render(
  <StrictMode>
    <BootErrorBoundary>
      <CalculatorApp />
    </BootErrorBoundary>
  </StrictMode>,
);
