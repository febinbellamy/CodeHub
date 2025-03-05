<div align="center">
  <img src="https://github.com/user-attachments/assets/98efde8e-ed32-4711-be2e-48f10d89ba52" alt="CodeHub logo">
</div>
<h1 align="center">An open-source browser extension that automatically pushes your Codewars submissions to GitHub</h1>
<br/>
<div align="center">
  <a href="https://chromewebstore.google.com/detail/codehub/gadnnalppjchhdpplcjkhfabddchhlkp">
    <img src="https://github.com/user-attachments/assets/bb6c71c9-96c6-4186-98dc-2e21c18c676a" alt="Install extension in Chrome Web Store" style="text-decoration: none;">
  </a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/codehub-addon/">
    <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Install extension in Mozilla Add-ons Store" width="340" height="96" style="text-decoration: none;">
  </a>
</div>
<br/> 
<div align="center">
  <a href="https://github.com/febinbellamy/CodeHub/pulls">
    <img src="https://img.shields.io/github/issues-pr/febinbellamy/CodeHub?label=Pull%20Requests&style=flat-square" alt="Pull Requests" style="text-decoration: none;">
  </a>
  <a href="https://github.com/febinbellamy/CodeHub/issues">
    <img src="https://img.shields.io/github/issues/febinbellamy/CodeHub?label=Issues&style=flat-square" alt="Issues" style="text-decoration: none;">
  </a>
  <a href="https://github.com/febinbellamy/CodeHub/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/febinbellamy/CodeHub?label=License&style=flat-square" alt="MIT License" style="text-decoration: none;">
  </a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20CodeHub%20-%20a%20Chrome%20extension%20that%20automatically%20syncs%20your%20Codewars%20solutions%20to%20GitHub!%20https%3A%2F%2Fgithub.com%2FFebinBellamy%2FCodeHub%20%23codewars%20%23github%20%23coding%20%23chromeextension%20%23opensource%20%23devtools">
    <img src="https://img.shields.io/badge/Share%20on-X-1DA1F2?logo=x&style=flat-square" alt="Share on X" style="text-decoration: none;">
  </a>
  <a href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fgithub.com%2FFebinBellamy%2FCodeHub&source=CodeHub">
    <img src="https://img.shields.io/badge/Share%20on-LinkedIn-0A66C2?logo=linkedin&style=flat-square" alt="Share on LinkedIn" style="text-decoration: none;">
  </a>
</div>
<br/> 
<div align="center">
  <img src="https://github.com/user-attachments/assets/6dd72b1d-88e7-4a50-b12d-874e0d5671db" alt="Example of extension interface" style="text-decoration: none;"/>
</div>

<br/>

## How To Use / Demo

### 1. Install the Extension
Download CodeHub from the [Chrome Web Store](https://chromewebstore.google.com/detail/codehub/gadnnalppjchhdpplcjkhfabddchhlkp) or [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/codehub-addon/).
### 2. Authenticate with GitHub
Click the CodeHub extension icon, then click the "Authenticate" button to connect your GitHub account.
### 3. Link a Repository
Connect CodeHub to an existing repository or create a new one. You can also add an optional directory path within the repository (for example: "coding_challenges/codewars"). Click the "Get Started" button when you're ready.
### 4. Start Coding
You're all set! Solve problems on Codewars, and your solutions will automatically sync to the linked GitHub repository after a successful submission.

For a detailed walkthrough, check out the demo video below:

https://github.com/user-attachments/assets/e635a168-6c43-4132-8cb9-36bcc750076e

<br/>

## Why CodeHub?
### Showcase Your Problem-Solving Skills
Having a GitHub repository with your Codewars solutions highlights your dedication to learning and improving as a developer. It serves as a portfolio that recruiters and hiring managers can easily review to see your coding abilities and consistency in action.   

### Track Your Progress
CodeHub organizes all of your Codewars solutions in your repository by difficulty level (6-kyu, 5-kyu, etc.). Each problem is stored in its own directory containing separate solution files for each language and a README for the problem description ([example](https://github.com/user-attachments/assets/28c23287-1689-4199-b6f5-9d440d7881f1)). This clear structure makes it easy to track your progress and see how much you've improved over time.  

### Save Time
CodeHub automates the process of committing and pushing your solutions to GitHub. Once set up, this extension will save you the time and hassle of manually copying, pasting, and uploading each solution to your repository.

<br/>

## Developing Locally
1. Fork this repo and clone it to your local machine.
2. Install Node.js and npm [here](https://nodejs.org/en/download).
3. Create a `credentials.js` file in the root directory of the `CodeHub` folder with the following content:
   ```javascript
   export const clientId = "YOUR_ID";
   export const clientSecret = "YOUR_SECRET";
   ```
   - For more information on creating GitHub apps, visit the [official documentation](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps).

4. In the root directory, run the following command:
    - For Chrome:
      ```bash
      node build.js
      ```
    - For Firefox:
      ```bash
      node build.js --firefox
      ```
5. Load the extension in developer mode. 
    - **For Chrome**:
      - Go to the extensions page (chrome://extensions)
      - Enable "Developer Mode" and click "Load unpacked"
      - Select the cloned `CodeHub` folder

    - **For Firefox**:
      - Go to the extensions page (about:debugging)
      - Click on "This Firefox" and then "Load Temporary Add-on"
      - Select the `manifest.json` file from the root directory of the cloned `CodeHub` folder

6. Enjoy!

<br/>

## Support
We appreciate your feedback and contributions! Here’s how you can help:
- Star this repository
- Leave us a review on the Chrome Web Store
- Create a [bug report](https://github.com/febinbellamy/CodeHub/issues/new?assignees=febinbellamy&labels=bug&projects=&template=bug_report.md&title=)
- Submit a [feature request](https://github.com/febinbellamy/CodeHub/issues/new?assignees=febinbellamy&labels=enhancement&projects=&template=feature_request.md&title=)

<br/>

## Code of Conduct
In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation. More details can be found at this project's [code of conduct](https://github.com/febinbellamy/CodeHub/blob/main/.github/code_of_conduct.md).

<br/>

## Acknowledgements

### LeetHub
After manually pushing hundreds of my Codewars solutions to GitHub, I searched for a tool to automate the process and came across [LeetHub](https://github.com/QasimWani/LeetHub) - an extension that does this for LeetCode solutions. While LeetHub wasn’t compatible with Codewars, its core functionality and UI served as an inspiration for the development of CodeHub.

### Frances Coronel
A big thank you to Frances Coronel for her [README template](https://gist.github.com/FrancesCoronel/1bfc2d4aecb01a834b46) - it was a great starting point for structuring the README for this project. 

### Learning Resources
The resources below helped me learn how to build a browser extension:
* [freeCodeCamp | Build a Chrome Extension – Course for Beginners](https://www.youtube.com/watch?v=0n809nd4Zu4&t=3512s&ab_channel=freeCodeCamp.org)
* [Gurulabs | Basics of Chrome Extension Playlist](https://www.youtube.com/playlist?list=PLBS1L3Ug2VVrTlexfI5i9OB0KpNfIjeeN)
* [Tiff in Tech | CODE WITH ME: Build a Chrome Extension | How to Build & Publish a Chrome Extension in 10 Minutes](https://www.youtube.com/watch?v=B8Ihv3xsWYs&t=9s&ab_channel=TiffInTech) 
