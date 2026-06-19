import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const reopen = async (_args: string, ctx: ExtensionCommandContext) => {
    const file = ctx.sessionManager.getSessionFile();
    if (!file) {
      ctx.ui.notify("No session file to reopen (ephemeral session)", "warning");
      return;
    }

    await ctx.switchSession(file, {
      withSession: async (ctx) => {
        ctx.ui.notify("Session re-opened", "info");
      },
    });
  };

  pi.registerCommand("reopen-session", {
    description: "Reopen the current session file",
    handler: reopen,
  });

  pi.registerCommand("rs", {
    description: "Alias for /reopen-session",
    handler: reopen,
  });
}
