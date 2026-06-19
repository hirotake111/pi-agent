import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerShortcut("ctrl+;", {
    description: "Open lazygit (interactive)",
    handler: async (ctx) => {
      if (!ctx.hasUI) {
        return; // interactive TUI required
      }

      const exitCode = await ctx.ui.custom<number | null>((tui, _theme, _kb, done) => {
        // Stop the TUI to give the spawned command full terminal control
        tui.stop();

        // Clear screen then run lazygit using the user's shell so env is respected
        process.stdout.write("\x1b[2J\x1b[H");
        const shell = process.env.SHELL || "/bin/sh";
        const result = spawnSync(shell, ["-c", "lazygit"], {
          stdio: "inherit",
          env: process.env,
        });

        // Restart TUI and request a render
        tui.start();
        tui.requestRender(true);

        // Signal completion and return
        done(result.status ?? 1);

        return { render: () => [], invalidate: () => {} };
      });

      // Notify user of result
      if (exitCode === 0) ctx.ui.notify("lazygit exited", "info");
      else ctx.ui.notify(`lazygit exited with code ${exitCode}`, "warning");
    },
  });
}
