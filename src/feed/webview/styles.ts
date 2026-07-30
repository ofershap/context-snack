import { closeCountdownStyles } from '../closeCountdownUi';

export function feedWebviewStyles(): string {
    return `
        * { box-sizing: border-box; user-select: none; }
        body {
            margin: 0;
            padding: 8px 8px 10px;
            background: #171514;
            color: #ebe4dc;
            font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }
        body.vscode-light {
            background: #f3eee8;
            color: #1c1917;
        }
        button {
            background: #252321;
            color: #ebe4dc;
            border: 1px solid rgba(255,255,255,0.08);
            padding: 4px 8px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
        }
        button:hover { background: #2e2b28; border-color: rgba(46,184,166,0.35); }
        #closeBtn { color: #c4a8a0; }
        #closeBtn:hover { border-color: rgba(196,168,160,0.35); background: #2a2321; }

        #deck {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            max-width: 520px;
            flex: 1;
            min-height: 180px;
        }
        #feed-stage {
            position: relative;
            flex: 1;
            min-width: 0;
            height: 100%;
            min-height: 180px;
        }

        .card {
            position: absolute;
            inset: 0;
            border-radius: 16px;
            padding: 12px 14px 12px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 14px 36px rgba(0,0,0,0.42);
            border: 1px solid rgba(255,255,255,0.07);
            background: #211f1d;
            touch-action: none;
            transition: transform 0.22s ease-out, opacity 0.22s ease-out;
            overflow: hidden;
        }

        .card-chrome {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-shrink: 0;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .card-chrome-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .card-chrome-title {
            font-size: 13px;
            font-weight: 600;
            color: #ebe4dc;
            letter-spacing: 0.01em;
        }
        .card-chrome-subtitle {
            font-size: 10px;
            font-weight: 500;
            color: #7a726a;
            letter-spacing: 0.01em;
        }
        .card-chrome-actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
            align-items: center;
        }
        .chrome-icon-btn {
            width: 30px;
            height: 28px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            line-height: 1;
        }
        .chrome-icon-btn.is-muted {
            opacity: 0.75;
            border-color: rgba(46,184,166,0.4);
        }

        .card-header { margin-bottom: 2px; flex-shrink: 0; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        .cat-cursor { background: rgba(46,184,166,0.14); color: #3dd4bf; }
        .cat-ai { background: rgba(46,184,166,0.1); color: #5ee0cc; }
        .cat-dev { background: rgba(255,255,255,0.06); color: #b8aea4; }
        .cat-social { background: rgba(235,180,120,0.12); color: #e8b888; }
        .cat-fun { background: rgba(232, 160, 90, 0.14); color: #f0b070; }

        .card-title {
            font-size: 17px;
            line-height: 1.28;
            font-weight: 700;
            color: #f5f0ea;
            margin: 6px 0 8px;
            flex-shrink: 0;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
        }
        .card-image-wrap {
            flex-shrink: 0;
            width: 100%;
            height: clamp(128px, 44%, 220px);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 8px;
            background: #181614;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .card.has-image .card-body {
            -webkit-line-clamp: 4;
        }
        .card-body {
            font-size: 14px;
            line-height: 1.5;
            font-weight: 400;
            color: #b8aea4;
            flex: 1;
            min-height: 0;
            margin: 0;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 8;
            overflow: hidden;
        }
        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.06);
            flex-shrink: 0;
            font-size: 11px;
            min-height: 22px;
        }
        .card-meta { color: #7a726a; }
        .card-open {
            color: #2eb8a6;
            font-weight: 600;
            letter-spacing: 0.02em;
        }

        .indicator {
            position: absolute;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 5px 10px;
            border-radius: 8px;
            border: 2px solid;
            opacity: 0;
            pointer-events: none;
        }
        .indicator-next { right: 16px; top: 48px; color: #2eb8a6; border-color: #2eb8a6; transform: rotate(10deg); }
        .indicator-prev { left: 16px; top: 48px; color: #b8aea4; border-color: #6b635c; transform: rotate(-10deg); }
        .indicator-open { left: 50%; top: 44px; transform: translateX(-50%); color: #2eb8a6; border-color: #2eb8a6; }

        #footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            flex-shrink: 0;
            width: 100%;
            max-width: 420px;
        }
        #progress {
            font-size: 11px;
            color: #6b635c;
            font-weight: 500;
        }
        body.vscode-light #progress { color: #6b635c; }
        #hint {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.01em;
            color: #f0d78c;
            margin-top: 2px;
            text-align: center;
            line-height: 1.35;
            max-width: 380px;
        }
        body.vscode-light #hint { color: #1a1510; }
        .nav-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 15px;
            padding: 0;
            flex-shrink: 0;
        }
        .side-nav {
            width: 36px;
            height: 56px;
            border-radius: 12px;
            font-size: 16px;
            opacity: 0.92;
        }
        body.vscode-light button {
            background: #fff;
            color: #1c1917;
            border-color: rgba(0,0,0,0.1);
        }
        body.vscode-light button:hover {
            background: #f7f2ec;
            border-color: rgba(20,140,120,0.4);
        }
        #openBtn { color: #2eb8a6; }
        #openBtn:disabled {
            opacity: 0.3;
            cursor: default;
            color: #6b635c;
        }

        #endCard { text-align: center; justify-content: center; align-items: center; }
        #endCard .emoji { font-size: 40px; margin-bottom: 8px; }
        #endCard .card-title { -webkit-line-clamp: unset; }
        #endCard .card-body { flex: 0; -webkit-line-clamp: unset; color: #9a9188; }

${closeCountdownStyles()}`;
}
