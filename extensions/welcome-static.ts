import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Generation counter to avoid races when sessions change quickly.
  let sessionGeneration = 0;

  // Helper: show the widget after a short delay (gives the TUI a chance to initialize)
  function scheduleShow(ctx: any, generation: number) {
    setTimeout(() => {
      if (generation !== sessionGeneration) return; // session changed
      if (!ctx.hasUI) return;

      ctx.ui.setWidget("pi-welcome", (tui: any, theme: any) => {
        const title = theme.fg("accent", theme.bold("Welcome to pi — coding agent"));
        const lines = [
          "", // padding top
          title,
          "",
          theme.fg("muted", "• Open command palette with '/')"),
          theme.fg("muted", "• Press Ctrl+P to run commands"),
          theme.fg("muted", "• Use /reopen-session or /lazygit for quick tools"),
          "",
          theme.fg("dim", "This is a static welcome widget. Edit extensions/welcome-static.ts to change it."),
        ];

        return {
          render: () => lines,
          invalidate: () => { },
        };
      });
    }, 100);
  }

  // Dismiss helper
  function dismiss(ctx?: any) {
    try {
      // ctx may be undefined for some handlers; use pi.sendMessage not available here, so require ctx when possible
      if (ctx?.hasUI) {
        ctx.ui.setWidget("pi-welcome", undefined);
        ctx.ui.setStatus("pi-welcome-status", undefined);
      }
    } catch {
      /* ignore */
    }
  }

  // Show on initial startup only. Clear for other session starts.
  pi.on("session_start", (event, ctx) => {
    sessionGeneration++;
    // Clear any leftover UI first
    if (ctx.hasUI) {
      ctx.ui.setWidget("pi-welcome", undefined);
      ctx.ui.setStatus("pi-welcome-status", undefined);
    }

    if (!ctx.hasUI) return;

    if (event.reason !== "startup") {
      // Do not re-show on reload/new/resume/fork; ensure cleared
      return;
    }

    // Schedule the welcome widget (short delay to let Pi initialize)
    scheduleShow(ctx, sessionGeneration);
  });

  // Ensure widget is cleared when session shuts down
  pi.on("session_shutdown", (_event, ctx) => {
    sessionGeneration++;
    dismiss(ctx);
  });

  // Auto-dismiss when the agent starts responding or when a tool is called
  pi.on("agent_start", (_event, ctx) => {
    dismiss(ctx);
  });
  pi.on("tool_call", (_event, ctx) => {
    dismiss(ctx);
  });

  // Commands to manually control the widget
  pi.registerCommand("welcome-dismiss", {
    description: "Dismiss the welcome widget",
    handler: async (_args, ctx) => {
      dismiss(ctx);
      if (ctx.hasUI) ctx.ui.notify("Welcome dismissed", "info");
    },
  });

  pi.registerCommand("welcome-reload", {
    description: "Reload and reshow the welcome widget",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) return;
      dismiss(ctx);
      // small delay then reshow
      setTimeout(() => scheduleShow(ctx, sessionGeneration), 50);
      ctx.ui.notify("Welcome widget reloaded", "info");
    },
  });
}

