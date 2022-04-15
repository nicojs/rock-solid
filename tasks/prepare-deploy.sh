rm -rf .deploy
mkdir .deploy

cd .deploy
node -e 'const pkg = require("../packages/backend/package.json"); delete pkg.dependencies["@rock-solid/frontend"]; delete pkg.dependencies["@rock-solid/shared"]; require("fs").writeFileSync("package.json", JSON.stringify(pkg, null, 2), "utf-8");'
cp ../packages/backend/package-lock.json .
npm ci --production
mkdir -p ./node_modules/@rock-solid/frontend
cp -r ../packages/frontend/dist ./node_modules/@rock-solid/frontend/dist 
cp -r ../packages/shared ./node_modules/@rock-solid/shared
cp -r ../packages/backend/prisma ./prisma
cp -r ../packages/backend/import ./import
cp -r ../packages/backend/dist ./dist
npm run prisma:client:generate
zip -r deploy.zip .
