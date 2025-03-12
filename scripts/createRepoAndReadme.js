const createNewRepo = async (repoName) => {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  const url = `https://api.github.com/user/repos`;
  const repoDescription = `A collection of solutions to various Codewars problems! - Created using [CodeHub](https://github.com/FebinBellamy/CodeHub)`;
  const data = { name: repoName, description: repoDescription };
  const options = {
    method: "POST",
    headers: new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.log(
        `GitHub API error: ${response.status} - ${response.statusText}`
      );
      return false;
    }
    const json = await response.json();
    return json["name"];
  } catch (e) {
    console.log("Error creating a new repo:", e);
    return null;
  }
};

const createReadmeAndDirectory = async (repoName, directory) => {
  const { accessToken, githubUsername } = await chrome.storage.local.get([
    "accessToken",
    "githubUsername",
  ]);
  const commitMessage = "Initial commit";
  const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents${
    directory ? "/" + directory : ""
  }/README.md`;
  const repoDescriptionEncoded = btoa(
    "A collection of solutions to various Codewars problems! - Created using [CodeHub](https://github.com/FebinBellamy/CodeHub)"
  );
  const data = { message: commitMessage, content: repoDescriptionEncoded };
  const options = {
    method: "PUT",
    headers: new Headers({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.log(
        `GitHub API error: ${response.status} - ${response.statusText}`
      );
      return false;
    }
    return true;
  } catch (e) {
    console.log("Error creating a README.md in the new repo/directory:", e);
    return false;
  }
};

export { createNewRepo, createReadmeAndDirectory };
