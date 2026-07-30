import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface MuteFile {
    ids: string[];
    updatedAt: number;
}

export class ConversationMuteStore {
    private readonly mutePath: string;
    private ids = new Set<string>();

    constructor() {
        const dir = path.join(os.homedir(), '.cursor', 'context-snack');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.mutePath = path.join(dir, 'muted-conversations.json');
        this.load();
    }

    isMuted(conversationId: string): boolean {
        return this.ids.has(conversationId);
    }

    mute(conversationIds: string[]) {
        let changed = false;
        for (const id of conversationIds) {
            if (!id || this.ids.has(id)) {
                continue;
            }
            this.ids.add(id);
            changed = true;
        }
        if (changed) {
            this.save();
        }
    }

    pruneTo(activeIds: Set<string>) {
        let changed = false;
        for (const id of [...this.ids]) {
            if (!activeIds.has(id)) {
                this.ids.delete(id);
                changed = true;
            }
        }
        if (changed) {
            this.save();
        }
    }

    private load() {
        try {
            if (!fs.existsSync(this.mutePath)) {
                return;
            }
            const parsed = JSON.parse(fs.readFileSync(this.mutePath, 'utf-8')) as MuteFile;
            this.ids = new Set((parsed.ids ?? []).filter(id => typeof id === 'string'));
        } catch (error) {
            console.error('Context Snack: failed to load muted conversations', error);
            this.ids = new Set();
        }
    }

    private save() {
        try {
            const payload: MuteFile = {
                ids: [...this.ids],
                updatedAt: Date.now()
            };
            fs.writeFileSync(this.mutePath, JSON.stringify(payload, null, 2), 'utf-8');
        } catch (error) {
            console.error('Context Snack: failed to save muted conversations', error);
        }
    }
}
