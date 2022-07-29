#!/usr/bin/env bash

git fetch --all
git reset --hard origin/main
git commit --allow-empty -m "trigger build"
git push origin
