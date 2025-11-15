const supportedFileExtensions = {
  agda: ".agda",
  bf: ".bf",
  c: ".c",
  cfml: ".cfm",
  cpp: ".cpp",
  cobol: ".cbl",
  coffeescript: ".coffee",
  clojure: ".clj",
  commonlisp: ".lisp",
  coq: ".v",
  crystal: ".cr",
  "c#": ".cs",
  d: ".d",
  dart: ".dart",
  elixir: ".ex",
  elm: ".elm",
  erlang: ".erl",
  factor: ".factor",
  forth: ".fs",
  fortran: ".f",
  fsharp: ".fs",
  go: ".go",
  groovy: ".groovy",
  haskell: ".hs",
  haxe: ".hs",
  idris: ".idr",
  java: ".java",
  javascript: ".js",
  julia: ".jl",
  kotlin: ".kt",
  lambdacalc: ".lam",
  lean: ".lean",
  lua: ".lua",
  nasm: ".asm",
  nim: ".nim",
  objc: ".m",
  ocaml: ".ml",
  pascal: ".pas",
  perl: ".pl",
  php: ".php",
  powershell: ".ps1",
  prolog: ".pl",
  purescript: ".purs",
  python: ".py",
  r: ".r",
  reason: ".re",
  racket: ".rkt",
  raku: ".raku",
  riscv: ".o",
  ruby: ".rb",
  rust: ".rs",
  scala: ".scala",
  solidity: ".sol",
  shell: ".sh",
  sql: ".sql",
  swift: ".swift",
  typescript: ".ts",
  vb: ".vb",
};

const checkFileExists = async (baseUrl, accessToken) => {
  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      headers: new Headers({
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
      }),
    });

    if (response.ok) {
      const fileData = await response.json();
      return {
        fileExists: true,
        data: fileData,
      };
    }
    return {
      fileExists: false,
      data: null,
    };
  } catch (error) {
    console.log("Error checking for pre-existing file!", error.message);
  }
  return {
    fileExists: false,
    data: null,
  };
};

const isContentIdentical = (existingContentBase64, newContentBase64) => {
  try {
    const existingContentBase64Clean = existingContentBase64.replace(/\s/g, "");
    const existingContent = decodeURIComponent(
      escape(atob(existingContentBase64Clean))
    ).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const newContent = decodeURIComponent(escape(atob(newContentBase64)))
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const existingNormalized = existingContent.replace(/^\n+/, "").replace(/\n+$/, "");
    const newNormalized = newContent.replace(/^\n+/, "").replace(/\n+$/, "");

    return existingNormalized === newNormalized;
  } catch (error) {
    console.log("Error comparing file content:", error);
    return false;
  }
};

const getUrl = (
  githubUsername,
  repo,
  directory,
  rank,
  directoryName,
  fileName,
  languageOfUserSolution,
  isReadmeFile,
  folderStructure
) => {
  let url = `https://api.github.com/repos/${githubUsername}/${repo}/contents/${
    directory ? directory + "/" : ""
  }`;

  if (folderStructure === "level-problem-language") {
    return (
      url + `${rank}/${directoryName}/${isReadmeFile ? "README.md" : fileName}`
    );
  } else if (folderStructure === "language-level-problem") {
    return (
      url +
      `${languageOfUserSolution}/${rank}/${directoryName}/${
        isReadmeFile ? "README.md" : fileName
      }`
    );
  } else if (folderStructure === "level-language-problem") {
    return (
      url +
      `${rank}/${languageOfUserSolution}/${directoryName}/${
        isReadmeFile ? "README.md" : fileName
      }`
    );
  }
};

const addOrUpdateSolution = async (
  githubUsername,
  repo,
  directory,
  rank,
  directoryName,
  fileName,
  languageOfUserSolution,
  encodedSolution,
  accessToken
) => {
  const { folderStructure = "level-problem-language" } =
    await chrome.storage.local.get("folderStructure");

  const url = getUrl(
    githubUsername,
    repo,
    directory,
    rank,
    directoryName,
    fileName,
    languageOfUserSolution,
    false,
    folderStructure
  );

  const { fileExists, data: fileData } = await checkFileExists(
    url,
    accessToken
  );

  const data = {
    message: fileExists
      ? "Update solution - CodeHub"
      : "Add solution - CodeHub",
    content: encodedSolution,
  };

  if (fileExists) {
    if (isContentIdentical(fileData.content, encodedSolution)) {
      console.log(
        `There were no changes detected in your solution file! No update needed.`
      );
      return;
    }
    data.sha = fileData.sha;
  }

  const options = {
    method: "PUT",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    console.log(
      `Success! The solution has been ${
        fileExists ? "updated" : "added"
      } in the ${directoryName} directory.`
    );
    return { success: true };
  } catch (error) {
    console.log("Error pushing codewars solution to GitHub!");
    return { success: false, error: error.message };
  }
};

const addReadme = async (
  githubUsername,
  repo,
  directory,
  rank,
  directoryName,
  languageOfUserSolution,
  encodedReadMe,
  accessToken
) => {
  const { folderStructure = "level-problem-language" } =
    await chrome.storage.local.get("folderStructure");

  const url = getUrl(
    githubUsername,
    repo,
    directory,
    rank,
    directoryName,
    "README.md",
    languageOfUserSolution,
    true,
    folderStructure
  );

  const { fileExists } = await checkFileExists(url, accessToken);
  if (fileExists) {
    console.log("The README.md for this solution already exists!");
    return;
  }
  const data = {
    message: "Add README.md - CodeHub",
    content: encodedReadMe,
  };
  const options = {
    method: "PUT",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    console.log(
      `Success! The README.md has been added to the ${directoryName} directory.`
    );
  } catch (error) {
    console.log(
      "Error pushing README.md for codewars solution to GitHub!",
      error.message
    );
  }
};

export { supportedFileExtensions, addReadme, addOrUpdateSolution };
