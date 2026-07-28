/**
 * Dependency-free FileMaker calculation syntax highlighter.
 *
 * This is the fallback used by render.js when no `window.hljs` is present. It reads the same
 * grammar data as hljs-language.js (see filemaker-grammar.js) and produces the same
 * `.hljs-*`-classed markup a real highlight.js integration would, so filemaker-script.css /
 * filemaker-script-dark.css style both paths identically. It intentionally only implements the
 * token categories this one grammar needs (comments, strings, variables, numbers, operators,
 * keyword/built-in/function words) — it is not a general-purpose highlighting engine.
 */
import { KEYWORDS, BUILTIN_CONSTANTS, FUNCTIONS } from './filemaker-grammar.js';

function toSet(spaceJoined) {
    return new Set(spaceJoined.split(/\s+/).filter(Boolean));
}

const KEYWORD_SET = toSet(KEYWORDS);
const BUILT_IN_SET = toSet(BUILTIN_CONSTANTS);
const FUNCTION_SET = toSet(FUNCTIONS);

// Alternation order doesn't matter for correctness here (the branches' possible starting
// characters don't overlap, except comment vs. operator on '/' — comment is listed first so a
// bare '/' or an unterminated '/*' still falls through to the operator branch, same as it would
// with a stricter engine).
const TOKEN_RE = new RegExp(
    [
        String.raw`(?<comment>//.*|/\*[\s\S]*?\*/)`,
        String.raw`(?<string>"(?:\\.|[^"\r\n])*"|'(?:\\.|[^'\r\n])*')`,
        String.raw`(?<variable>\$\$?[A-Za-z_][A-Za-z0-9_]*)`,
        String.raw`(?<number>\b(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)\b)`,
        String.raw`(?<operator><=|>=|<>|[+\-*/=^<>&;,≠≤≥])`,
        String.raw`(?<word>[A-Za-z_][A-Za-z0-9_]*)`,
    ].join('|'),
    'g',
);

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(scope, text) {
    return `<span class="hljs-${scope}">${escapeHtml(text)}</span>`;
}

function renderWord(word) {
    if (KEYWORD_SET.has(word)) return span('keyword', word);
    if (BUILT_IN_SET.has(word)) return span('built_in', word);
    if (FUNCTION_SET.has(word)) return `<span class="hljs-title function_">${escapeHtml(word)}</span>`;
    return escapeHtml(word);
}

function renderToken(match) {
    const g = match.groups;
    if (g.comment) return span('comment', g.comment);
    if (g.string) return span('string', g.string);
    if (g.variable) return span('variable', g.variable);
    if (g.number) return span('number', g.number);
    if (g.operator) return span('operator', g.operator);
    return renderWord(g.word);
}

/** Returns HTML markup for a FileMaker calculation source string. */
export function highlightFileMakerCalc(code) {
    let out = '';
    let last = 0;
    TOKEN_RE.lastIndex = 0;
    let match;
    while ((match = TOKEN_RE.exec(code))) {
        out += escapeHtml(code.slice(last, match.index));
        out += renderToken(match);
        last = match.index + match[0].length;
    }
    out += escapeHtml(code.slice(last));
    return out;
}
