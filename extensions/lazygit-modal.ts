import { spawn, spawnSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

function stripAnsi(s: string): string {
	// crude but effective ANSI CSI sequence remover
	return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("lazygit", {
		description: "Open a small lazygit snapshot modal (limited, non-interactive)",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("lazygit requires the TUI (not available in print/RPC)", "error");
				return;
			}

			// Create a temp file for script output
			const out = join(tmpdir(), `pi-lazygit-${Date.now()}.log`);

			// Spawn `script` to capture lazygit's initial screen into a file.
			// We'll forcibly kill the process after a short timeout to get a snapshot.
			const shell = process.env.SHELL || "/bin/sh";
			const child = spawn(shell, ["-c", `script -q ${out} -c \"lazygit\"`], {
				stdio: "ignore",
				env: process.env,
				detached: true,
			});

			// Kill after 900ms to produce a quick snapshot (tweak if needed)
			const timeoutMs = 900;
			let killed = false;
			const timer = setTimeout(() => {
				try {
					process.kill(-child.pid, "SIGKILL"); // kill process group
				} catch (e) {
					try {
						child.kill("SIGKILL");
					} catch {}
				}
				killed = true;
			}, timeoutMs);

			// Wait for child to exit
			await new Promise<void>((resolve) => child.on("exit", () => resolve()));
			clearTimeout(timer);

			let content = "(failed to capture lazygit output)";
			try {
				const raw = readFileSync(out);
				content = stripAnsi(raw.toString("utf8")) || "(empty)";
			} catch (e) {
				content = `(error reading snapshot: ${String(e)})`;
			}

			// Cleanup temp file
			try {
				unlinkSync(out);
			} catch {}

			// Show the snapshot in a centered overlay (limited, read-only)
			await ctx.ui.custom<void>(
				(tui, theme, _kb, done) => {
					// Wrap long lines and cap number of lines so the overlay stays small
					function wrapAndTruncate(input: string, maxCols = 80, maxLines = 20) {
						const lines = input.replace(/\r/g, "").split("\n");
						const out: string[] = [];
						for (const line of lines) {
							let rest = line;
							while (rest.length > 0) {
								out.push(rest.slice(0, maxCols));
								rest = rest.slice(maxCols);
								if (out.length >= maxLines) break;
							}
							if (out.length >= maxLines) break;
						}
						if (out.length >= maxLines) {
							out.splice(maxLines - 1, out.length - (maxLines - 1), "... (truncated)");
						}
						return out.join("\n");
					}

					const header = theme.fg("accent", "lazygit (snapshot - non-interactive)\n\n");
					const body = wrapAndTruncate(content, 80, 20);
					const text = new Text(header + theme.fg("muted", body), 0, 0);

					text.onKey = (key: string) => {
						if (key === "escape" || key === "return") {
							done();
						}
						return true; // consume keys
					};

					return text;
				},
				{
					overlay: true,
					overlayOptions: { anchor: "center", width: "50%", height: "40%", margin: 1 },
				},
			);
		},
	});

	// Short alias
	pi.registerCommand("lg", {
		description: "Alias for /lazygit (snapshot)",
		handler: async (args, ctx) => pi.commands.run("lazygit", args, ctx),
	});

	// Register a global shortcut id that can be mapped in keybindings.json
	pi.registerShortcut("extension.lazygit", {
		description: "Open lazygit snapshot",
		handler: async (ctx) => {
			await pi.commands.run("lazygit", [], ctx);
		},
	});
}
