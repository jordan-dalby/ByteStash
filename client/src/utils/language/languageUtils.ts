import { CodeFragment } from '../../types/snippets';
import * as monaco from 'monaco-editor';

interface LanguageConfig {
  aliases: string[];
  monacoAlias: string;
  label: string;
}

type LanguageMapping = {
  [key: string]: LanguageConfig;
};

const LANGUAGE_MAPPING: LanguageMapping = {
  // Web Development Languages
  javascript: {
    aliases: ['js', 'node', 'nodejs', 'jsx', 'mjs', 'cjs', 'node.js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020'],
    monacoAlias: 'javascript',
    label: 'javascript'
  },
  typescript: {
    aliases: ['ts', 'tsx', 'typescript-next', 'typescriptreact', 'ts-next', 'tsx', 'tsc'],
    monacoAlias: 'typescript',
    label: 'typescript'
  },
  html: {
    aliases: ['html5', 'htm', 'xhtml', 'markup', 'shtml', 'dhtml', 'html4'],
    monacoAlias: 'html',
    label: 'html'
  },
  css: {
    aliases: ['css3', 'styles', 'stylesheet', 'scss', 'sass', 'less', 'postcss', 'style'],
    monacoAlias: 'css',
    label: 'css'
  },
  php: {
    aliases: ['php3', 'php4', 'php5', 'php7', 'php8', 'phps', 'phtml', 'laravel', 'symfony'],
    monacoAlias: 'php',
    label: 'php'
  },
  webassembly: {
    aliases: ['wasm', 'wat', 'wasmer', 'wasmtime'],
    monacoAlias: 'wasm',
    label: 'webassembly'
  },

  // System Programming Languages
  c: {
    aliases: ['h', 'ansi-c', 'c99', 'c11', 'c17', 'c23'],
    monacoAlias: 'c',
    label: 'c'
  },
  cpp: {
    aliases: ['c++', 'cc', 'cxx', 'hpp', 'h++', 'cplusplus', 'c++11', 'c++14', 'c++17', 'c++20', 'c++23'],
    monacoAlias: 'cpp',
    label: 'c++'
  },
  csharp: {
    aliases: ['cs', 'c#', 'dotnet', 'net', 'dotnetcore', 'net6', 'net7', 'net8', 'aspnet'],
    monacoAlias: 'csharp',
    label: 'c#'
  },
  rust: {
    aliases: ['rs', 'rust-lang', 'rustlang', 'cargo', 'rustc'],
    monacoAlias: 'rust',
    label: 'rust'
  },
  go: {
    aliases: ['golang', 'go-lang', 'gopher', 'gocode'],
    monacoAlias: 'go',
    label: 'go'
  },

  // JVM Languages
  java: {
    aliases: ['jsp', 'jvm', 'spring', 'javase', 'javaee', 'jakarta'],
    monacoAlias: 'java',
    label: 'java'
  },
  kotlin: {
    aliases: ['kt', 'kts', 'kotlinx', 'ktor', 'spring-kotlin'],
    monacoAlias: 'kotlin',
    label: 'kotlin'
  },
  scala: {
    aliases: ['sc', 'scala2', 'scala3', 'dotty', 'akka', 'play'],
    monacoAlias: 'scala',
    label: 'scala'
  },
  groovy: {
    aliases: ['gvy', 'gy', 'gsh', 'gradle', 'grails'],
    monacoAlias: 'groovy',
    label: 'groovy'
  },

  // Scripting Languages
  python: {
    aliases: ['py', 'py3', 'pyc', 'pyd', 'pyo', 'pyw', 'pyz', 'django', 'flask', 'fastapi', 'jupyter'],
    monacoAlias: 'python',
    label: 'python'
  },
  ruby: {
    aliases: ['rb', 'rbw', 'rake', 'gemspec', 'podspec', 'thor', 'irb', 'rails', 'sinatra'],
    monacoAlias: 'ruby',
    label: 'ruby'
  },
  perl: {
    aliases: ['pl', 'pm', 'pod', 't', 'prl', 'perl5', 'perl6', 'raku'],
    monacoAlias: 'perl',
    label: 'perl'
  },
  lua: {
    aliases: ['luac', 'luajit', 'moonscript', 'lua5'],
    monacoAlias: 'lua',
    label: 'lua'
  },

  // Shell Scripting
  bash: {
    aliases: ['sh', 'shell', 'zsh', 'ksh', 'csh', 'tcsh', 'shellscript', 'bash-script', 'bashrc', 'zshrc'],
    monacoAlias: 'shell',
    label: 'bash'
  },
  powershell: {
    aliases: ['ps', 'ps1', 'psd1', 'psm1', 'pwsh', 'psc1', 'pssc', 'windows-powershell'],
    monacoAlias: 'powershell',
    label: 'powershell'
  },
  batch: {
    aliases: ['bat', 'cmd', 'command', 'dos', 'windows-batch'],
    monacoAlias: 'bat',
    label: 'batch'
  },

  // Database Languages
  sql: {
    aliases: ['mysql', 'postgresql', 'psql', 'pgsql', 'plsql', 'tsql', 'mssql', 'sqlite', 'oracle', 'mariadb'],
    monacoAlias: 'sql',
    label: 'sql'
  },
  mongodb: {
    aliases: ['mongo', 'mongoose', 'nosql', 'mongosh'],
    monacoAlias: 'javascript',
    label: 'mongodb'
  },

  // Markup & Configuration Languages
  markdown: {
    aliases: ['md', 'mkd', 'mkdown', 'mdwn', 'mdown', 'markd', 'mdx', 'rmd', 'commonmark'],
    monacoAlias: 'markdown',
    label: 'markdown'
  },
  yaml: {
    aliases: ['yml', 'yaml-frontmatter', 'docker-compose', 'k8s', 'kubernetes', 'ansible'],
    monacoAlias: 'yaml',
    label: 'yaml'
  },
  json: {
    aliases: ['json5', 'jsonc', 'jsonl', 'geojson', 'json-ld', 'composer', 'package.json', 'tsconfig', 'jsonnet'],
    monacoAlias: 'json',
    label: 'json'
  },
  xml: {
    aliases: ['rss', 'atom', 'xhtml', 'xsl', 'plist', 'svg', 'xmlns', 'xsd', 'dtd', 'maven'],
    monacoAlias: 'xml',
    label: 'xml'
  },
  toml: {
    aliases: ['ini', 'conf', 'config', 'cargo.toml', 'poetry.toml'],
    monacoAlias: 'ini',
    label: 'toml'
  },

  // Cloud & Infrastructure
  terraform: {
    aliases: ['tf', 'hcl', 'tfvars', 'terraform-config'],
    monacoAlias: 'hcl',
    label: 'terraform'
  },
  dockerfile: {
    aliases: ['docker', 'containerfile', 'docker-compose'],
    monacoAlias: 'dockerfile',
    label: 'dockerfile'
  },
  kubernetes: {
    aliases: ['k8s', 'helm', 'kustomize'],
    monacoAlias: 'yaml',
    label: 'kubernetes'
  },

  // Other Programming Languages
  swift: {
    aliases: ['swiftc', 'swift5', 'swift-lang', 'apple-swift'],
    monacoAlias: 'swift',
    label: 'swift'
  },
  r: {
    aliases: ['rlang', 'rscript', 'r-stats', 'r-project'],
    monacoAlias: 'r',
    label: 'r'
  },
  julia: {
    aliases: ['jl', 'julia-lang', 'julialang'],
    monacoAlias: 'julia',
    label: 'julia'
  },
  dart: {
    aliases: ['flutter', 'dart-lang', 'dart2', 'dart3'],
    monacoAlias: 'dart',
    label: 'dart'
  },
  elm: {
    aliases: ['elm-lang', 'elm-format'],
    monacoAlias: 'elm',
    label: 'elm'
  },
  apex: {
    aliases: [],
    monacoAlias: 'apex',
    label: 'apex'
  },

  // Smart Contract Languages
  solidity: {
    aliases: ['sol', 'ethereum', 'smart-contract', 'evm'],
    monacoAlias: 'sol',
    label: 'solidity'
  },
  vyper: {
    aliases: ['vy', 'ethereum-vyper'],
    monacoAlias: 'python',
    label: 'vyper'
  },

  // Scientific & Math
  latex: {
    aliases: ['tex', 'context', 'ltx', 'bibtex', 'texinfo'],
    monacoAlias: 'latex',
    label: 'latex'
  },
  matlab: {
    aliases: ['octave', 'm', 'mat'],
    monacoAlias: 'matlab',
    label: 'matlab'
  },

  // Query Languages
  graphql: {
    aliases: ['gql', 'graphqlschema', 'apollo'],
    monacoAlias: 'graphql',
    label: 'graphql'
  },
  cypher: {
    aliases: ['neo4j', 'neo4j-cypher'],
    monacoAlias: 'cypher',
    label: 'cypher'
  },

  // Other
  abap: {
    aliases: [],
    monacoAlias: 'abap',
    label: 'abap'
  },

  // Fallback
  plaintext: {
    aliases: ['text', 'txt', 'plain', 'log', 'raw'],
    monacoAlias: 'plaintext',
    label: 'plaintext'
  }
};

const getAllLanguageIdentifiers = (): Set<string> => {
  const identifiers = new Set<string>();
  
  Object.entries(LANGUAGE_MAPPING).forEach(([key, config]) => {
    identifiers.add(key.toLowerCase());
    config.aliases.forEach(alias => identifiers.add(alias.toLowerCase()));
  });
  
  return identifiers;
};

const LANGUAGE_IDENTIFIERS = getAllLanguageIdentifiers();

export const normalizeLanguage = (lang: string): string => {
  if (!lang || typeof lang !== 'string') return 'plaintext';
  
  const normalized = lang.toLowerCase().trim();
  
  if (LANGUAGE_MAPPING[normalized]) {
    return normalized;
  }
  
  for (const [language, config] of Object.entries(LANGUAGE_MAPPING)) {
    if (config.aliases.includes(normalized)) {
      return language;
    }
  }
  
  return lang;
};

export const getMonacoLanguage = (lang: string): string => {
  const normalized = normalizeLanguage(lang);
  return LANGUAGE_MAPPING[normalized]?.monacoAlias || lang;
};

export const getLanguageLabel = (lang: string): string => {
  const normalized = normalizeLanguage(lang);
  return LANGUAGE_MAPPING[normalized]?.label || lang;
};

export interface LanguageInfo {
  language: string;
  aliases: string[];
  label: string;
}

export const getSupportedLanguages = (): LanguageInfo[] => {
  return Object.entries(LANGUAGE_MAPPING).map(([lang, config]) => ({
    language: lang,
    aliases: [...config.aliases],
    label: config.label
  }));
};

export const isLanguageSupported = (lang: string): boolean => {
  const normalized = lang?.toLowerCase().trim() || '';
  return LANGUAGE_IDENTIFIERS.has(normalized);
};

export const getLanguageAliases = (lang: string): string[] => {
  const normalized = normalizeLanguage(lang);
  return LANGUAGE_MAPPING[normalized]?.aliases || [];
};

export const getAllLanguageAliases = (): Record<string, string[]> => {
  return Object.entries(LANGUAGE_MAPPING).reduce((acc, [lang, config]) => {
    acc[lang] = [...config.aliases];
    return acc;
  }, {} as Record<string, string[]>);
};

export const getUniqueLanguages = (fragments: CodeFragment[]): string => {
  if (!fragments || fragments.length === 0) {
    return 'No language';
  }

  const uniqueLanguages = [...new Set(
    fragments.map(fragment => getLanguageLabel(fragment.language))
  )];

  return uniqueLanguages.join(', ');
};

export const configureMonaco = () => {
  monaco.editor.defineTheme('bytestash-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'parameter', foreground: '9CDCFE' },
      { token: 'builtin', foreground: '4EC9B0' },
      { token: 'operator', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2F2F2F',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorBracketMatch.background': '#0D3A58',
      'editorBracketMatch.border': '#888888',
    }
  });
};

export const initializeMonaco = () => {
  configureMonaco();
};

export const languageMapping = LANGUAGE_MAPPING;