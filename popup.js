console.log("popup.js");
// need to create a state - has the user already authenticated github account?
// if so, set it to true.
// then in the popup.html file, only display the <div id="stats"> and hide the other div.
// if user hasn't authenticated, set it to false.
// then in the popup.html file, only display the <div id="authenticate"> and hdie the other div
let isUserAuthenticated = false;

// code for authenticating a user via Oauth2
const key = "codehub_token";
const accessTokenUrl = "https://github.com/login/oauth/access_token";
const authorizationUrl = "https://github.com/login/oauth/authorize";
const clientId = "Ov23li7szM8iAvm9OCXh";
const redirectUrl = "https://github.com/";
const scopes = ["repo"];

const authenticateUser = () => {
  console.log("authenticateUser Function fired!!");
  let url = `${authorizationUrl}?client_id=${clientId}&redirect_uri${redirectUrl}&scope=${scopes[0]}`;
  console.log("url", url);
  // open this URL in a new Chrome tab^ (need to implement)

  // once user authenticates via the URL^,
  // redirect to https://GitHub.com (currently works)
  // close the current tab (need to implement)
  // open up welcome.html in a new tab (need to implement)
  // change isUserAuthenticated state to true;

  isUserAuthenticated = true;
};

const authenticateButton = document.querySelector("#authenticate-btn");
authenticateButton.addEventListener("click", authenticateUser);
