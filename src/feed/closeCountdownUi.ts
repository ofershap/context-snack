export const CLOSE_COUNTDOWN_MARKERS = [
    'close-countdown',
    'countdown-ring',
    'countdown-number',
    'keep-open-btn'
];

export function closeCountdownStyles(): string {
    return `
        #closeCountdown {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 22px;
            background: rgba(10, 9, 8, 0.72);
            backdrop-filter: blur(2px);
        }
        #closeCountdown.visible {
            display: flex;
        }
        .countdown-ring {
            width: 148px;
            height: 148px;
            border-radius: 50%;
            border: 4px solid rgba(235, 228, 220, 0.22);
            box-shadow:
                inset 0 0 0 2px rgba(235, 228, 220, 0.08),
                0 0 0 10px rgba(0, 0, 0, 0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: radial-gradient(circle at 50% 42%, #2a2622 0%, #171514 70%);
        }
        .countdown-ring::before {
            content: "";
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 2px dashed rgba(235, 228, 220, 0.18);
            animation: countdownSpin 3s linear infinite;
        }
        .countdown-number {
            font-size: 72px;
            font-weight: 700;
            line-height: 1;
            color: #f5f0ea;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.04em;
        }
        .keep-open-btn {
            background: transparent;
            color: #ebe4dc;
            border: 1px solid rgba(235, 228, 220, 0.35);
            padding: 10px 18px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
            font-family: inherit;
        }
        .keep-open-btn:hover {
            border-color: #2eb8a6;
            color: #5ee0cc;
            background: rgba(46, 184, 166, 0.08);
        }
        @keyframes countdownSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
}

export function closeCountdownMarkup(): string {
    return `
    <div id="closeCountdown" class="close-countdown" aria-live="polite">
        <div class="countdown-ring">
            <div class="countdown-number" id="countdownNumber">3</div>
        </div>
        <button type="button" class="keep-open-btn" id="keepOpenBtn">Keep opened</button>
    </div>`;
}

export function closeCountdownClientJs(): string {
    return `
        let closeCountdownTimer = null;
        let closeCountdownValue = 3;

        function startCloseCountdown() {
            const overlay = document.getElementById("closeCountdown");
            const numberEl = document.getElementById("countdownNumber");
            if (!overlay || !numberEl) return;
            if (closeCountdownTimer) {
                clearInterval(closeCountdownTimer);
                closeCountdownTimer = null;
            }
            closeCountdownValue = 3;
            numberEl.textContent = String(closeCountdownValue);
            overlay.classList.add("visible");
            closeCountdownTimer = setInterval(function () {
                closeCountdownValue -= 1;
                if (closeCountdownValue <= 0) {
                    clearInterval(closeCountdownTimer);
                    closeCountdownTimer = null;
                    numberEl.textContent = "1";
                    vscode.postMessage({ command: "confirmClose" });
                    return;
                }
                numberEl.textContent = String(closeCountdownValue);
            }, 1000);
        }

        function cancelCloseCountdown() {
            const overlay = document.getElementById("closeCountdown");
            if (closeCountdownTimer) {
                clearInterval(closeCountdownTimer);
                closeCountdownTimer = null;
            }
            if (overlay) {
                overlay.classList.remove("visible");
            }
        }

        var keepOpenBtn = document.getElementById("keepOpenBtn");
        if (keepOpenBtn) {
            keepOpenBtn.addEventListener("click", function () {
                cancelCloseCountdown();
                vscode.postMessage({ command: "keepOpen" });
            });
        }
    `;
}
