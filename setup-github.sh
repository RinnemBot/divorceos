#!/bin/bash

# Divorce Agent GitHub Setup Script
# Run this script to push your code to GitHub

echo "Setting up Divorce Agent for GitHub..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Configure git (if not already done)
read -p "Enter your GitHub email: " email
read -p "Enter your GitHub name: " name

git config user.email "$email"
git config user.name "$name"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Divorce Agent"

# Add remote
git remote add origin https://github.com/Rinnembot/divorceos.git

# Rename branch to main
git branch -M main

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "Done! Your code is now at: https://github.com/Rinnembot/divorceos"
echo ""
echo "Next step: Deploy to Vercel at https://vercel.com/new"
