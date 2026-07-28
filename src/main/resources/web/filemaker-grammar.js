/**
 * Shared FileMaker calculation grammar data.
 *
 * Single source of truth for the keyword/function lists and token patterns, consumed by both
 * hljs-language.js (the highlight.js integration, for consumers that provide `window.hljs`)
 * and filemaker-highlight.js (the dependency-free fallback tokenizer used when they don't).
 */

const CONTROL_KEYWORDS = 'if case';
const LOGICAL_KEYWORDS = 'and or not xor';

export const KEYWORDS = `${CONTROL_KEYWORDS} ${LOGICAL_KEYWORDS}`;

export const BUILTIN_CONSTANTS = [
    'boolean byte char class double float int interface long short void',
    'True true False false',
    'JSONArray JSONBoolean JSONNull JSONNumber JSONObject JSONRaw JSONString',
    'Plain Bold Italic Underline HighlightYellow Condense Extend Strikethrough',
    'SmallCaps Superscript Subscript Uppercase Lowercase Titlecase WordUnderline',
    'DoubleUnderline AllStyles',
    'objectType hasFocus objectName containsFocus isFrontPanel isActive',
    'isObjectHidden bounds left right top bottom width height rotation',
    'startPoint endPoint source content enclosingObject containedObjects',
].join(' ');

export const FUNCTIONS = [
    // Math
    'Abs Acos Asin Atan Ceiling Cos Degrees Div Exp Floor Int Lg Ln Log Max Min Mod Pi Radians Round Sign Sin Sqrt Tan Truncate',
    // Statistical
    'Average Count StDev StDevP Sum Variance VarianceP',
    // Text
    'Char Code Exact Filter FilterValues Left LeftValues LeftWords Length Lower Middle MiddleValues MiddleWords',
    'Position Proper Quote Replace Right RightValues RightWords Substitute TextColor TextColorRemove TextFont',
    'TextFontRemove TextFormatRemove TextSize TextSizeRemove TextStyleAdd TextStyleRemove Trim TrimAll Upper WordCount',
    // Date/Time
    'Date Day DayName DayNameJ DayOfWeek DayOfYear Hour Minute Month MonthName MonthNameJ Seconds Time Timestamp WeekOfYear WeekOfYearFiscal Year YearName',
    // Conversion
    'GetAsBoolean GetAsCSS GetAsDate GetAsNumber GetAsSVG GetAsText GetAsTime GetAsTimestamp GetAsURLEncoded',
    // Get family
    'Get',
    // Database/Fields
    'DatabaseNames FieldBounds FieldComment FieldIDs FieldNames FieldRepetitions FieldStyle FieldType GetField GetFieldName GetNthRecord GetRepetition GetSummary GetValue Lookup LookupNext',
    // Japanese text
    'Hiragana KanaHankaku KanaZenkaku KanjiNumeral Katakana NumToJText RomanHankaku RomanZenkaku',
    // Layout/Window
    'GetLayoutObjectAttribute LayoutIDs LayoutNames LayoutObjectNames WindowNames',
    // List
    'List ValueCount ValueListIDs ValueListItems ValueListNames',
    // Script/Relation
    'RelationInfo ScriptIDs ScriptNames',
    // Table
    'TableIDs TableNames',
    // Financial
    'FV NPV PMT PV',
    // Logical/Special
    'Case Choose Evaluate EvaluationError If IsEmpty IsValid IsValidExpression Combination Extend External Factorial GetNextSerialValue Last Let PatternCount Random RGB Self SerialIncrement SetPrecision',
    // JSON
    'JSONSetElement JSONGetElement JSONDeleteElement JSONListKeys JSONListValues JSONFormatElements',
    // Encoding
    'Base64Encode Base64Decode TextEncode TextDecode',
    // Query/Iteration
    'ExecuteSQL While',
].join(' ');

export const VARIABLE_PATTERN = /\$\$?[A-Za-z_][A-Za-z0-9_]*/;
export const NUMBER_PATTERN = /\b(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)\b/;
export const OPERATOR_PATTERN = /<=|>=|<>|[+\-*\/=^<>&;,≠≤≥]/;
