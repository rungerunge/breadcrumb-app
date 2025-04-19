@echo off
echo Setting up git configuration...
git add .
git commit -m "Fix breadcrumb app with improved features and error handling"

echo Ready to push! Run the following command in your terminal:
echo git push https://USERNAME:PERSONAL_ACCESS_TOKEN@github.com/rungerunge/breadcrumb-app.git main
echo Replace USERNAME with your GitHub username and PERSONAL_ACCESS_TOKEN with your personal access token

echo For security, close this window after you've completed the push 