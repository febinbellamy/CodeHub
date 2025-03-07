import { clientId, clientSecret } from "../credentials.js";

const accessTokenUrl = "https://github.com/login/oauth/access_token";
const authorizeUrl = "https://github.com/login/oauth/authorize";
const redirectUrl = "https://github.com/";
const scopes = "repo";
const authUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}`;

const getGitHubAccessToken = async (githubCode) => {
  const url = `${accessTokenUrl}?client_id=${clientId}&client_secret=${clientSecret}&code=${githubCode}`;
  const options = {
    method: "POST",
    headers: new Headers({
      Accept: "application/json",
    }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    if (json["access_token"]) {
      chrome.storage.local.set({ accessToken: json["access_token"] });
    }
  } catch (error) {
    console.log("Error! Unable to get access token", error.message);
  }
};

const getGithubUsername = async () => {
  chrome.storage.local.get(["accessToken"], async (result) => {
    const accessToken = result.accessToken;
    const url = `https://api.github.com/user`;
    const options = {
      method: "GET",
      headers: new Headers({
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
      }),
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      const username = json["login"];
      chrome.storage.local.set({ githubUsername: username });
    } catch (e) {
      console.log("Error! Unable to get github username", e.message);
    }
  });
};

const onTabUpdate = async (tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("github.com/?code=")) {
    chrome.tabs.onUpdated.removeListener(onTabUpdate);
    const code = tab.url.split("=")[1];
    await getGitHubAccessToken(code);
    await getGithubUsername();
    chrome.storage.local.set({ isUserAuthenticated: true });
    chrome.runtime.sendMessage({ action: "updateUI" });
    chrome.tabs.create({ url: "welcome.html", active: true });
  }
};

export { authUrl, onTabUpdate };
