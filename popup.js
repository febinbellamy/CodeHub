const authButton = document.querySelector("#authenticate-btn");
const authRequestSection = document.querySelector("#authenticate-request");
const linkRepoButton = document.querySelector("#link-repo-btn");
const linkRepoRequestSection = document.querySelector("#link-repo-request");
const repoConnectedSection = document.querySelector("#repo-connected");

authButton.addEventListener("click", () => {
  console.log("Authenticate button clicked!");
  chrome.runtime.sendMessage({ action: "authenticateUser" });
});

linkRepoButton.addEventListener("click", () => {
  console.log("Link repo button clicked!");
  console.log("Opening up welcome.html in a new tab");
  window.open("welcome.html", "_blank").focus();
});

chrome.storage.local.get(
  ["isUserAuthenticated", "isRepoConnected"],
  (result) => {
    const { isUserAuthenticated, isRepoConnected } = result;

    if (!isUserAuthenticated && !isRepoConnected) {
      repoConnectedSection.style.display = "none";
      linkRepoRequestSection.style.display = "none";
      authRequestSection.style.display = "block";
    } else if (isUserAuthenticated && !isRepoConnected) {
      authRequestSection.style.display = "none";
      repoConnectedSection.style.display = "none";
      linkRepoRequestSection.style.display = "block";
    } else if (isUserAuthenticated && isRepoConnected) {
      authRequestSection.style.display = "none";
      linkRepoRequestSection.style.display = "none";
      repoConnectedSection.style.display = "block";
    }
  }
);
