// Accepted file extensions for code upload
export const ACCEPTED_FILE_EXTENSIONS = [
  // JavaScript/TypeScript
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  // Python
  ".py",
  ".pyw",
  ".pyi",
  // Java/JVM languages
  ".java",
  ".kt",
  ".kts",
  ".scala",
  ".groovy",
  // C/C++
  ".c",
  ".cpp",
  ".cxx",
  ".cc",
  ".c++",
  ".h",
  ".hpp",
  ".hxx",
  // C#
  ".cs",
  // Web languages
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".less",
  // PHP
  ".php",
  ".phtml",
  // Ruby
  ".rb",
  ".rbw",
  // Go
  ".go",
  // Rust
  ".rs",
  // Swift
  ".swift",
  // Shell scripts
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".ps1",
  // Data formats
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  // SQL
  ".sql",
  // Markup
  ".md",
  ".markdown",
  ".tex",
  // Config files
  ".dockerfile",
  ".gitignore",
  ".makefile",
  // Other
  ".r",
  ".R",
  ".m",
  ".pl",
  ".lua",
  ".vim",
  ".txt",
].join(",");

// Detect programming language from file extension
export const detectLanguageFromFilename = (filename: string): string => {
  const extensionMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    mjs: "javascript",
    cjs: "javascript",

    // Python
    py: "python",
    pyw: "python",
    pyi: "python",

    // Java/JVM languages
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    groovy: "groovy",

    // C/C++
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    "c++": "cpp",
    h: "c",
    hpp: "cpp",
    hxx: "cpp",

    // C#
    cs: "csharp",

    // Web languages
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",

    // PHP
    php: "php",
    phtml: "php",

    // Ruby
    rb: "ruby",
    rbw: "ruby",

    // Go
    go: "go",

    // Rust
    rs: "rust",

    // Swift
    swift: "swift",

    // Shell scripts
    sh: "shell",
    bash: "bash",
    zsh: "shell",
    fish: "shell",
    ps1: "powershell",

    // Data formats
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    ini: "ini",

    // SQL
    sql: "sql",

    // Markup
    md: "markdown",
    markdown: "markdown",
    tex: "latex",

    // Config files
    dockerfile: "dockerfile",
    gitignore: "gitignore",
    makefile: "makefile",

    // Other
    r: "r",
    R: "r",
    m: "matlab",
    pl: "perl",
    lua: "lua",
    vim: "vim",
    txt: "plaintext",
  };

  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? extensionMap[extension] || "plaintext" : "plaintext";
};

// Read file content as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
};

// Validate file for code upload
export const validateCodeFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // Check file size (max 1MB)
  const maxSize = 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 1MB",
    };
  }

  // Check if it's a text file
  if (
    !file.type.startsWith("text/") &&
    file.type !== "application/json" &&
    file.type !== ""
  ) {
    // Allow files without MIME type (common for code files)
    const allowedExtensions = ACCEPTED_FILE_EXTENSIONS.split(",").map((ext) =>
      ext.replace(".", "")
    );

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: "Please upload a valid code file",
      };
    }
  }

  return { isValid: true };
};

// Process uploaded file and return code fragment data
export const processUploadedFile = async (
  file: File
): Promise<{
  file_name: string;
  code: string;
  language: string;
  position: number;
}> => {
  const validation = validateCodeFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const code = await readFileAsText(file);
  const language = detectLanguageFromFilename(file.name);

  return {
    file_name: file.name?.split(".")[0],
    code: code,
    language: language,
    position: 0,
  };
};
