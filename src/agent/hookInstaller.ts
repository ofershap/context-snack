import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const HOOK_SCRIPT_NAME = 'context-snack-agent-state.mjs';
const HOOK_COMMAND = `./hooks/${HOOK_SCRIPT_NAME}`;

export async function installContextSnackHooks(extensionUri: vscode.Uri): Promise<void> {
    const cursorDir = path.join(os.homedir(), '.cursor');
    const hooksDir = path.join(cursorDir, 'hooks');
    const hooksJsonPath = path.join(cursorDir, 'hooks.json');
    const sourceHook = vscode.Uri.joinPath(extensionUri, '.cursor', 'hooks', HOOK_SCRIPT_NAME);
    const targetHook = path.join(hooksDir, HOOK_SCRIPT_NAME);

    if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
    }

    const hookSource = await vscode.workspace.fs.readFile(sourceHook);
    fs.writeFileSync(targetHook, hookSource);
    fs.chmodSync(targetHook, 0o755);

    let config: HooksConfig;
    try {
        config = readHooksJson(hooksJsonPath);
    } catch (err) {
        console.error('Failed to parse hooks.json, skipping hooks registration:', err);
        return;
    }

    let changed = false;

    for (const event of ['beforeSubmitPrompt', 'stop', 'sessionEnd'] as const) {
        const entries = config.hooks[event] ?? [];
        let eventChanged = false;
        const migrated = entries.map((entry) => {
            if (entry.command.includes('pending-games-agent-state.mjs')) {
                eventChanged = true;
                return { ...entry, command: HOOK_COMMAND };
            }
            return entry;
        });
        const alreadyInstalled = migrated.some(isContextSnackHook);
        if (!alreadyInstalled) {
            migrated.push({ command: HOOK_COMMAND, timeout: 5 });
            eventChanged = true;
        }
        if (eventChanged) {
            config.hooks[event] = migrated;
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(hooksJsonPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
    }
}

interface HookEntry {
    command: string;
    timeout?: number;
}

interface HooksConfig {
    version: number;
    hooks: Record<string, HookEntry[]>;
}

function isContextSnackHook(entry: HookEntry): boolean {
    return entry.command.includes(HOOK_SCRIPT_NAME);
}

function readHooksJson(hooksJsonPath: string): HooksConfig {
    if (!fs.existsSync(hooksJsonPath)) {
        return { version: 1, hooks: {} };
    }

    const parsed = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf-8')) as HooksConfig;
    parsed.hooks ??= {};
    parsed.version ??= 1;
    return parsed;
}
