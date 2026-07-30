#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const STATE_DIR = join(homedir(), '.cursor', 'context-snack');
const STATE_FILE = join(STATE_DIR, 'busy.json');

function readConversations() {
  if (!existsSync(STATE_FILE)) {
    return {};
  }
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    return parsed.conversations ?? {};
  } catch {
    return {};
  }
}

function writeState(conversations) {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  const now = Date.now();
  writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        busy: Object.keys(conversations).length > 0,
        conversations,
        updatedAt: now,
      },
      null,
      2
    ),
    'utf-8'
  );
}

async function main() {
  let inputData = '';
  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  let input;
  try {
    input = JSON.parse(inputData);
  } catch {
    process.stdout.write('{}');
    process.exit(0);
  }

  const event = input.hook_event_name;
  const conversationId = input.conversation_id;
  const workspaceRoots = Array.isArray(input.workspace_roots) ? input.workspace_roots : [];
  const now = Date.now();

  if (event === 'beforeSubmitPrompt') {
    if (!conversationId) {
      process.stdout.write('{}');
      process.exit(0);
    }
    const conversations = readConversations();
    conversations[conversationId] = { startedAt: now, workspaceRoots };
    writeState(conversations);
  } else if (event === 'stop' || event === 'sessionEnd') {
    if (!conversationId) {
      process.stdout.write('{}');
      process.exit(0);
    }
    const conversations = readConversations();
    delete conversations[conversationId];
    writeState(conversations);
  }

  process.stdout.write('{}');
  process.exit(0);
}

main().catch(() => process.exit(0));
