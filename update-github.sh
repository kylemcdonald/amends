#!/usr/bin/env bash

git fetch --all
git reset --hard origin/main
npm run build
git add -u .
git commit -m "update"
git push origin
