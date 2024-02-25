#!/bin/bash

for package in backend
do
    echo "Downloading $package/main..."
    curl -s --create-dirs -o packages/$package/reports/stryker-incremental.json https://dashboard.stryker-mutator.io/api/reports/github.com/nicojs/rock-solid/main?module=$package
done
echo 'Done ✅'
