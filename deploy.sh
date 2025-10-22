#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ensure we're using Node 20
nvm use 20

# Build and deploy to Firebase
npm run deploy:firebase
