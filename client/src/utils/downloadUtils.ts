import JSZip from "jszip";

// Get file extension based on language
export const getFileExtension = (language: string): string => {
  const extensionMap: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    java: "java",
    cpp: "cpp",
    "c++": "cpp",
    c: "c",
    csharp: "cs",
    "c#": "cs",
    php: "php",
    ruby: "rb",
    go: "go",
    rust: "rs",
    swift: "swift",
    kotlin: "kt",
    scala: "scala",
    perl: "pl",
    lua: "lua",
    r: "r",
    matlab: "m",
    shell: "sh",
    bash: "sh",
    powershell: "ps1",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    xml: "xml",
    json: "json",
    yaml: "yml",
    yml: "yml",
    markdown: "md",
    sql: "sql",
    dockerfile: "dockerfile",
    vim: "vim",
    ini: "ini",
    toml: "toml",
    makefile: "makefile",
    gitignore: "gitignore",
    plaintext: "txt",
    text: "txt",
  };
  const normalizedLanguage = language.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extensionMap[normalizedLanguage] || "txt";
};

// Download a file with given content and filename
export const downloadFile = (
  content: string | Blob,
  filename: string,
  mimeType: string = "text/plain"
): void => {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download a code fragment with appropriate filename and extension
export const downloadFragment = (
  code: string,
  fileName: string,
  language: string
): void => {
  const hasExtension = fileName.includes(".");
  const finalFileName = hasExtension
    ? fileName
    : `${fileName}.${getFileExtension(language)}`;
  downloadFile(code, finalFileName);
};

// Create and download a zip file containing multiple code fragments
export const downloadSnippetArchive = async (
  snippetTitle: string,
  fragments: Array<{
    code: string;
    file_name: string;
    language: string;
  }>
): Promise<void> => {
  try {
    const zip = new JSZip();
    const folderName =
      snippetTitle.replace(/[^a-zA-Z0-9-_\s]/g, "").trim() || "snippet";
    const folder = zip.folder(folderName);
    const usedFilenames = new Set<string>();
    fragments.forEach((fragment) => {
      const hasExtension = fragment.file_name.includes(".");
      const baseFileName = hasExtension
        ? fragment.file_name
        : `${fragment.file_name}.${getFileExtension(fragment.language)}`;
      let uniqueFileName = baseFileName;
      let counter = 1;
      while (usedFilenames.has(uniqueFileName)) {
        const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, "");
        const ext = baseFileName.includes(".")
          ? baseFileName.split(".").pop()
          : "";
        uniqueFileName = ext
          ? `${nameWithoutExt}_${counter}.${ext}`
          : `${nameWithoutExt}_${counter}`;
        counter++;
      }
      usedFilenames.add(uniqueFileName);
      folder?.file(uniqueFileName, fragment.code);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const zipFileName = `${folderName}.zip`;
    downloadFile(content, zipFileName, "application/zip");
  } catch (error) {
    console.error("Error creating zip file:", error);
    throw new Error(
      "Failed to create archive. Please try downloading files individually."
    );
  }
};
