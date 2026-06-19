import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;

    ctx.ui.setWidget("pi-welcome", (tui, theme) => {
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

    // optional status indicator in footer
    // ctx.ui.setStatus("pi-welcome-status", ctx.ui.theme.fg("accent", "● welcome"));

  });

  // cleanup on session_end (registered once at extension load)
  pi.on("session_shutdown", (_event, ctx) => {
    try {
      ctx.ui.setWidget("pi-welcome", undefined);
      ctx.ui.setStatus("pi-welcome-status", undefined);
    } catch { }
  });
}

