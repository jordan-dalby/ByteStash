// x3-4gl-language.ts
// Monaco language definition for Sage X3 4GL / X3 Source (.src),
// derived from the Notepad++ "X3 Source" UDL (x3src.xml).
//
// Drop this file in client/src/utils/language/ and import registerX3Language()
// from configureMonaco() in languageUtils.tsx (see wiring instructions below).

import * as monaco from "monaco-editor";

const X3_LANGUAGE_ID = "x3-4gl";

// --- Keyword sets, pulled 1:1 from the UDL's KeywordLists ---------------

// Keywords1 (statements) — UDL style "KEYWORDS1"
const x3Statements = [
  "Actzo", "Additm", "Addmen", "Affzo", "Anasql", "As", "Askui", "Assign", "Blk", "Boxact",
  "Boxclr", "Boximp", "Boxinp", "Break", "By", "Call", "Callilog", "Callinterface", "Callocx", "Callui",
  "Case", "Chgfmt", "Chgstl", "Chgtbk", "Chgtfd", "Chgtzn", "Choose", "Close", "Columns", "Commit",
  "Const", "Dbgaff", "Dela", "Delete", "Disable", "Discombo", "Dislbox", "Diszo", "Dlgbox", "Edi",
  "Effzo", "Enable", "Endbox", "Envzo", "Errbox", "Execsql", "Extern", "Field", "Fillbox", "Filter",
  "Formula", "From", "Getseq", "Getui", "Global", "Gosub", "Goto", "Grizo", "Hint", "Hlpbox",
  "Infbox", "Infimg", "Inftxt", "Inpbox", "Insa", "Inter", "Iomode", "Key", "Kill", "Label",
  "Link", "Listbox", "Listimp", "Local", "Lock", "Look", "Men", "Mesbox", "Nap", "Next",
  "Nointer", "Onerrgo", "Onevent", "Onintgo", "Onkey", "Openi", "Openio", "Openo", "Order", "Pick",
  "Pickbox", "Pikltb", "Pmt", "Pokltb", "Putseq", "Qstbox", "Raz", "Rdseq", "Read", "Readlock",
  "Reb", "Report", "Resume", "Rewrite", "Rollback", "RTZ", "Run", "Schar", "Seek", "Selbox",
  "Seldest", "Selimp", "Semdu", "Send", "Setfct", "SetFCT", "Setlbox", "Setlob", "Setmdu", "Setmok",
  "Sleep", "Sorta", "Sql", "Step", "System", "Then", "Titcol", "Titled", "To", "Transmask",
  "Trbegin", "Treebox", "Unlock", "Update", "Value", "Variable", "When", "Where", "With", "Write",
  "Wrnbox", "Wrseq",
];

// Folding open/close keywords — styled identically to Keywords1 in the UDL,
// so treated as ordinary control-flow keywords here.
const x3Control = [
  "Case", "Else", "Elseif", "End", "Endcase", "Endif", "For", "Funprog", "If", "Next",
  "Repeat", "Return", "Subprog", "Until", "Wend", "While",
];

// Keywords2 (types + system globals) — UDL style "KEYWORDS2"
const x3Types = [
  "ACTION", "Blbfile", "BOUT", "CHAINE", "Char", "CHMEN", "Clbfile", "CLECUR", "COUZON", "Date",
  "Decimal", "File", "GACTION", "GADONIX", "GASCII", "GBROWS", "GDIV", "GERR", "GERREUR", "GFLAG",
  "GFONC1", "GFONCTION", "GIACTX", "GIMPORT", "GINTRA", "GLOCK", "GMESSAGE", "GOK", "GPE", "GPOINT",
  "GPV", "GREP", "GROLL", "GSERVEUR", "GSOPHIA", "GSTAEND", "GSTANEW", "GSTATUS", "GTRACE", "GUSER",
  "GUTF8", "Integer", "Libelle", "Mask", "PROGOBJ", "PROGSUB", "REP", "REPONSE", "Shortint", "STAT",
  "TABLE", "VALEUR", "WINPROG",
];

// Keywords3 (built-in functions) — UDL style "KEYWORDS3"
const x3Functions = [
  "abs", "ach", "acos", "actihgup", "addmonth", "adxcio", "adxctx", "adxdbc", "adxdbo", "adxdbx",
  "adxdcs", "adxdir", "adxdlrec", "adxdpg", "adxfmt", "adxfname", "adxgtb", "adxifs", "adxioa", "adxirs",
  "adxium", "adxkpg", "adxksp", "adxliq", "adxlog", "adxmac", "adxmbm", "adxmda", "adxmother", "adxmpr",
  "adxmso", "adxmto", "adxmua", "adxmxl", "adxnfs", "adxpam", "adxpid", "adxpno", "adxrob", "adxsca",
  "adxseek", "adxtct", "adxtlk", "adxtms", "adxtuc", "adxtul", "adxtut", "adxuid", "adxuprec", "adxusr",
  "and", "anp", "ar2", "arr", "ascii", "ash", "asin", "atan", "atan2", "ath",
  "avg", "aweek", "ch", "chr$", "claleb", "clalev", "clanam", "clanbs", "clasiz", "clavar",
  "cnp", "cop$", "cos", "ctrans", "Curr", "currbox", "currind", "currlen", "date$", "datesyst",
  "day", "day$", "dayn", "dbglong", "dbgmode", "dbgstr", "Default", "Desc", "dim", "dir$",
  "eomonth", "errl", "errm", "errmes$", "errn", "errp", "evalue", "exp", "fac", "filcom",
  "fileabre", "filecla", "filelev", "filename", "filetyp", "filinfo", "filpath", "find", "First", "fix",
  "format$", "freemem", "fstat", "func", "gdat$", "getenv$", "graph$", "indcum", "indice", "inpmode",
  "instr", "int", "keylen", "keyname", "keyuniq", "Last", "left$", "len", "ln", "lockwait",
  "log", "maskabr", "maskcla", "maskcou", "masklev", "masknam", "masknbf", "maskrk", "masksiz", "max",
  "maxmem", "menchoix", "mess", "messname", "mid$", "min", "mkstat", "mod", "month", "month$",
  "nbind", "nbrecord", "nbruser", "nbzon", "nday", "nday$", "nolign", "nolign1", "nomap", "nor",
  "num$", "or", "parse", "pat", "pcolor", "pi", "prd", "progcan", "progldd", "progsiz",
  "progusd", "right$", "rnd", "rowcount", "seg$", "sgn", "sh", "sigma", "sin", "space$",
  "sqr", "stat1", "status", "string$", "sum", "tairec", "tan", "th", "time", "time$",
  "tolower", "toupper", "trtcou", "type", "uni", "uniqid", "val", "var", "varinit", "varmode",
  "ver$", "vireblc", "week", "xor", "year", "zc", "zoncou", "zonsor", "zonsui",
];

// Keywords4 (dialog / event handlers) — UDL style "KEYWORDS4"
const x3Events = [
  "AB_CREATION", "AB_MODIF", "ABA", "ABANDON", "AFFMSK", "ANNULE", "AP_ANNULE", "AP_CHANGE", "AP_CHOIX", "AP_CHOIX2",
  "AP_FILGAUCHE", "AP_IMPRIME", "AP_MAGNETO", "APRES_CHOI", "APRES_CRE", "APRES_MOD", "APRES_MODIF", "AUTORIS", "AV_ANNULE", "AV_CHOIX",
  "AV_IMPRIME", "AV_LISTE", "AV_MAGNETO", "AVANT_BOUTON", "AVANT_CHOI", "AVANT_MOD", "AVANT_MODFIC", "AVANT_OUVRE", "AVANTBOUT", "AVANTMOD",
  "BOITE", "BOUTON", "BOUTONS", "CHANGE", "CLECUR", "CONT_BATCH", "CONTROLE", "CREATION", "DEB_CRIT", "DEB_PICK",
  "DEBUT", "DEBUT_CRE", "DEBUT_MOD", "DEFBOUT", "DEFLIG", "DEFTRANS", "DEGRISE", "DEPICK", "DEVERROU", "DROIT",
  "ECR_TRACE", "EFFACE", "EFFMASK", "ENR", "ERREUR", "EXEACT", "EXEBOUT", "EXEC", "FERME", "FERME_TRACE",
  "FILGAUCHE", "FILTRE", "FIN", "FIN_ACTION", "FIN_CRIT", "FIN_MOD", "FIN_PICK", "FIN_TABLE", "FINMODIF", "FINSAI",
  "FIR", "FSTA", "GAU", "GAUCHE", "GAUCHE9", "GET_OS", "GRISE_LIENS", "HINT", "HLP", "ICONE",
  "INICRE", "INICRE_LIG", "INIMOD", "INIMOD_LIG", "INIPAG", "INIT", "INIT_DIA", "LAS", "LEC_TRACE", "LECTURE",
  "LIENS", "LIENS0", "LIENS2", "LIENS_LIG", "MACHINE", "MEN", "MESSAGE", "MODIF", "MOVE", "NOMTRTWIN",
  "NUMERO", "OBJET", "OK", "OUVRE", "OUVRE_BATCH", "OUVRE_BOITE", "OUVRE_TRACE", "PICKE", "PRE", "PRE_GAUCHE",
  "PRG", "RAF", "RAZCRE", "RAZDUP", "REMP_DERLU", "RISE", "RSTA", "SEL_LISTE", "SEL_TABLE", "SETBOUT",
  "SETTRANS", "SORTIE", "STATUT", "STYLE", "SUI", "SUI_GAUCHE", "SVG", "SYSTEME", "SYSTEME2", "TEMPOFF",
  "TEMPON", "TERMINE", "TIROIR", "TITRE", "TRT_DIV", "V_AFFICHE", "VALID", "VALLIG", "VARIANTE", "VERF_ANU",
  "VERF_CHG", "VERF_LISTE", "VERF_TABLE", "VERIF_CRE", "VERIF_MOD", "VERIFCRE_MOD", "VERROU",
];

// --- Language configuration (brackets, comment toggling, auto-close) ----

const x3LanguageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: "#",
  },
  brackets: [
    ["(", ")"],
    ["[", "]"],
  ],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
  ],
};

// --- Monarch tokenizer ----------------------------------------------------
// Comment: '#' to end of line (confirmed against Sage's own 4GL docs).
// Strings: '...' or "...", escaped by doubling the quote ('' or "").

const x3MonarchLanguage: monaco.languages.IMonarchLanguage = {
  ignoreCase: true,
  defaultToken: "",

  keywords: x3Statements,
  control: x3Control,
  types: x3Types,
  builtinFunctions: x3Functions,
  events: x3Events,

  operators: [
    "-", "!", "%", "&", "*", ",", ".", "/", "?", "^", "|", "~", "+", "<", "=", ">",
  ],

  symbols: /[=><!~?:&|+\-*\/\^%.,]+/,

  tokenizer: {
    root: [
      // Comments
      [/#.*$/, "comment"],

      // Numbers
      [/\d+\.\d+([eE][\-+]?\d+)?/, "number.float"],
      [/\d+/, "number"],

      // Strings (double / single quote, doubled-quote escaping)
      [/"/, { token: "string.quote", bracket: "@open", next: "@dstring" }],
      [/'/, { token: "string.quote", bracket: "@open", next: "@sstring" }],

      // Identifiers / keywords
      [
        /[A-Za-z_$][\w$]*/,
        {
          cases: {
            "@control": "keyword.control",
            "@keywords": "keyword",
            "@types": "type",
            "@builtinFunctions": "predefined",
            "@events": "constant",
            "@default": "identifier",
          },
        },
      ],

      // Brackets / delimiters
      [/[()\[\]]/, "@brackets"],
      [/[;,.]/, "delimiter"],

      // Operators
      [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],

      [/[ \t\r\n]+/, "white"],
    ],

    dstring: [
      [/[^"]+/, "string"],
      [/""/, "string.escape"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    sstring: [
      [/[^']+/, "string"],
      [/''/, "string.escape"],
      [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
  },
};

let registered = false;

/**
 * Registers the X3 4GL language with Monaco. Safe to call multiple times
 * (e.g. on hot reload) — registration only happens once.
 */
export const registerX3Language = (): void => {
  if (registered) return;

  monaco.languages.register({
    id: X3_LANGUAGE_ID,
    extensions: [".src"],
    aliases: ["X3 4GL", "X3 Source", "x3src", "sage-x3"],
  });

  monaco.languages.setLanguageConfiguration(X3_LANGUAGE_ID, x3LanguageConfiguration);
  monaco.languages.setMonarchTokensProvider(X3_LANGUAGE_ID, x3MonarchLanguage);

  registered = true;
};

export const X3_MONACO_LANGUAGE_ID = X3_LANGUAGE_ID;
