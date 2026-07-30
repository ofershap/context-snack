import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const MAX_SEEN = 120;

interface SeenFile {
    ids: string[];
    updatedAt: number;
}

export class FeedSeenStore {
    private readonly seenPath: string;
    private ids: string[] = [];

    constructor() {
        const dir = path.join(os.homedir(), '.cursor', 'context-snack');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.seenPath = path.join(dir, 'seen.json');
        this.load();
    }

    getSeenIds(): Set<string> {
        return new Set(this.ids);
    }

    markSeen(id: string) {
        if (!id) {
            return;
        }
        this.ids = [id, ...this.ids.filter(existing => existing !== id)].slice(0, MAX_SEEN);
        this.save();
    }

    private load() {
        try {
            if (!fs.existsSync(this.seenPath)) {
                return;
            }
            const parsed = JSON.parse(fs.readFileSync(this.seenPath, 'utf-8')) as SeenFile;
            this.ids = Array.isArray(parsed.ids) ? parsed.ids.filter(id => typeof id === 'string') : [];
        } catch (error) {
            console.error('Context Snack: failed to load seen cards', error);
            this.ids = [];
        }
    }

    private save() {
        try {
            const payload: SeenFile = { ids: this.ids, updatedAt: Date.now() };
            fs.writeFileSync(this.seenPath, JSON.stringify(payload, null, 2), 'utf-8');
        } catch (error) {
            console.error('Context Snack: failed to save seen cards', error);
        }
    }
}
