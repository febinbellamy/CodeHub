console.log("scripts/codewars.js");
console.log("main content script!");

let languageOfUserSolution = document
  .querySelector(".mr-4")
  .innerText.trimLeft();
let userSolution;
let name;
let description;
let rank;
let fileAndDirectoryName;

const attemptButton = document.querySelector("#attempt_btn");
attemptButton.addEventListener("click", () => {
  setTimeout(() => {
    const submitButton = document.querySelector("#submit_btn");
    if (submitButton !== null) {
      // check for the submit button - see if it's on the screen.
      // if so, as soon as it's clicked OR if Cmd/Ctrl + Enter keys are pressed, push the code to the user's GitHub repository
      submitButton.addEventListener("click", () => {});
    }
  }, 3000);
});

// grab a bunch of information from the submission page including:
// - the user's solution itself
const getUserSolution = () => {
  const userCodeBeforeParsing =
    document.querySelectorAll(".CodeMirror-lines")[0].innerText;
  console.log("userCodeBeforeParsing");
  const userCodeArr = userCodeBeforeParsing.split("\n");
  let result = "";

  for (let i = 0; i < userCodeArr.length; i++) {
    let elem = userCodeArr[i];
    if (/[^0-9]/.test(elem)) {
      result += elem;
      if (i !== userCodeArr.length - 1) {
        result += "\n";
      }
    }
  }
  userSolution = result;
  console.log("userSolution", userSolution);
};


// - the description of the code challenge and the difficulty level (get this via the CodeWars API - https://dev.codewars.com/#code-challenges-api
const fetchProblemDescriptionAndRank = async () => {
  const url = window.location.href;
  console.log(url); // https://www.codewars.com/kata/53d2697b7152a5e13d000b82/train/csharp
  const startingIndexOfId = 30;
  const endingIndexOfId = url.indexOf("/train/");
  const problemId = url.slice(startingIndexOfId, endingIndexOfId);
  try {
    const res = await fetch(
      `https://www.codewars.com/api/v1/code-challenges/${problemId}`
    );
    const json = await res.json();
    description = json["description"];
    rank = json["rank"]["name"];
    fileAndDirectoryName = json["slug"];
    name = json["name"];
  } catch (e) {
    console.log("Error!", e);
  }
};
setTimeout(getUserSolution, 4000);
fetchProblemDescriptionAndRank(); // description is what we need to add to a README.md file for a given problem

setTimeout(() => {
  console.log("languageOfUserSolution -->", languageOfUserSolution);
  console.log("userSolution -->", userSolution);
  console.log("name -->", name);
  console.log("description -->", description);
  console.log("rank -->", rank);
  console.log("fileAndDirectoryName -->", fileAndDirectoryName);
}, 5000);

// take all of this^^ info, create new files in the repository, and push them to the user's GitHub repository

// codewars screenflow:
// after they click submit,
// a dialog box appers that says --> "Submitting your final kata solution..."
// <div class="alert-box working">
//  <i class="icon-moon-circle-check is-green-text is-nudged-down"></i>
//      Impressive! You may take your time to refactor/comment your solution. Submit when ready.<a class="close">×</a></div>
// then user is redirected to the kata's solutions page
