/** FileMaker Script fence renderer — transforms <pre><code class="language-filemaker-script"> into accordion panels */
import { highlightFileMakerCalc } from './filemaker-highlight.js';

const CLIPBOARD_SVG = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a4.5 4.5 0 00-1.329-.124H9.75M8.25 21h8.25"/></svg>';
const CHECK_SVG = '<svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';

const HIGHLIGHTED_STEPS = new Set([
    'Allow User Abort',
    'If', 'Else If', 'Else', 'End If',
    'Loop', 'Exit Loop If', 'End Loop',
    'Exit Script', 'Halt Script',
    'Open Transaction', 'Commit Transaction', 'Revert Transaction', 'Set Revert Transaction on Error',
    'Pause/Resume Script',
    'Perform Script', 'Perform Script on Server', 'Perform Script on Server with Callback',
    'Set Error Capture',
]);

let calcIdCounter = 0;

function parseScript(text) {
    const lines = text.split('\n');
    const steps = [];
    let currentStep = null;
    let currentOption = null;
    let continuationLines = [];

    function flushOption() {
        if (!currentOption) return;
        if (continuationLines.length > 0) {
            currentOption.value = continuationLines.join('\n').trimEnd();
            currentOption.isMultiLine = true;
        }
        currentStep.options.push(currentOption);
        currentOption = null;
        continuationLines = [];
    }

    function flushStep() {
        if (!currentStep) return;
        flushOption();
        steps.push(currentStep);
        currentStep = null;
    }

    for (const line of lines) {
        if (line.trim() === '') {
            flushOption();
            continue;
        }

        // Step header: "N. Step Name [ optional summary ] *(disabled)*" — number is optional.
        // Name group (\S.+?) must start with non-whitespace so indented option lines don't match.
        const headerMatch = line.match(/^(?:(\d+)\.\s+)?(\S.+?)(?:\s*\[(.+)\])?(?:\s*\*\(disabled\)\*)?\s*$/);
        if (headerMatch) {
            flushStep();
            const name = headerMatch[2].trim();
            currentStep = {
                number: headerMatch[1] != null ? parseInt(headerMatch[1]) : null,
                name,
                summary: headerMatch[3] ? headerMatch[3].trim() : null,
                isComment: name.startsWith('#'),
                disabled: /\*\(disabled\)\*/.test(line),
                options: [],
            };
            currentOption = null;
            continuationLines = [];
            continue;
        }

        if (!currentStep) continue;

        // Option line: "   → Key: Value" or "   → Key:" (multi-line follows)
        const optionMatch = line.match(/^\s+→\s+(.+?):\s*(.*)$/);
        if (optionMatch) {
            flushOption();
            currentOption = {
                key: optionMatch[1].trim(),
                value: optionMatch[2].trim(),
                isMultiLine: false,
            };
            continuationLines = [];
            continue;
        }

        // Continuation line for the current option's value
        if (currentOption && /^\s+\S/.test(line)) {
            continuationLines.push(line.trimStart());
        }
    }

    flushStep();
    return steps;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderStep(step) {
    const commentClass = step.isComment ? ' fm-step--comment' : '';
    const disabledClass = step.disabled ? ' fm-step--disabled' : '';

    // Comment steps: drop "(comment)" and fold the summary text directly into the name
    let nameHtml, summaryHtml;
    if (step.isComment) {
        const commentText = step.summary ? ` ${escapeHtml(step.summary)}` : '';
        nameHtml = `<span class="fm-step-name">#${commentText}</span>`;
        summaryHtml = '';
    } else {
        const highlightClass = (!step.disabled && HIGHLIGHTED_STEPS.has(step.name)) ? ' fm-step-name--highlighted' : '';
        nameHtml = `<span class="fm-step-name${highlightClass}">${escapeHtml(step.name)}</span>`;
        summaryHtml = step.summary
            ? `<span class="fm-step-summary">[ ${escapeHtml(step.summary)} ]</span>`
            : '';
    }

    const numHtml = step.number != null
        ? `<span class="fm-step-num">${escapeHtml(String(step.number))}.</span>`
        : '';
    const disabledMarker = (step.disabled && !step.isComment)
        ? `<span class="fm-step-disabled-marker">//</span>`
        : '';

    if (step.options.length === 0) {
        return `<div class="fm-step fm-step--simple${commentClass}${disabledClass}">
            <div class="fm-step-header">${numHtml}${disabledMarker}${nameHtml}${summaryHtml}</div>
        </div>`;
    }

    const headerContent = `${numHtml}${disabledMarker}${nameHtml}${summaryHtml}`;

    const rows = step.options.map(opt => {
        const keyHtml = escapeHtml(opt.key);
        let valHtml;
        if (opt.isMultiLine) {
            const id = `fm-calc-${++calcIdCounter}`;
            valHtml = `<div class="fm-calc-block"><pre><code id="${id}" class="language-filemaker">${escapeHtml(opt.value)}</code></pre></div>`;
        } else {
            valHtml = `<span class="fm-val-text">${escapeHtml(opt.value)}</span>`;
        }
        return `<tr><td class="fm-key">${keyHtml}</td><td class="fm-val">${valHtml}</td></tr>`;
    }).join('');

    return `<details class="fm-step${commentClass}${disabledClass}">
        <summary class="fm-step-header">
            ${headerContent}
        </summary>
        <div class="fm-step-body"><table class="fm-options">${rows}</table></div>
    </details>`;
}

export function renderFileMakerScripts(root = document) {
    root.querySelectorAll('pre code.language-filemaker-script').forEach(el => {
        const steps = parseScript(el.textContent);

        const wrapper = document.createElement('div');
        wrapper.className = 'fm-script not-prose';
        wrapper.innerHTML = steps.map(renderStep).join('');

        wrapper.querySelectorAll('code.language-filemaker').forEach(calcEl => {
            if (window.hljs) {
                window.hljs.highlightElement(calcEl);
            } else {
                calcEl.innerHTML = highlightFileMakerCalc(calcEl.textContent);
                calcEl.classList.add('hljs');
            }
        });

        wrapper.querySelectorAll('.fm-calc-block pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (!code) return;
            pre.style.position = 'relative';
            const btn = document.createElement('button');
            btn.className = 'fm-copy-btn no-print';
            btn.setAttribute('aria-label', 'Copy');
            btn.innerHTML = CLIPBOARD_SVG;
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(code.textContent).then(() => {
                    btn.innerHTML = CHECK_SVG;
                    setTimeout(() => { btn.innerHTML = CLIPBOARD_SVG; }, 2000);
                });
            });
            pre.appendChild(btn);
        });

        el.closest('pre').replaceWith(wrapper);
    });
}
