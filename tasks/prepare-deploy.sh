rm -rf .deploy
mkdir .deploy

cd .deploy
cp ../packages/backend/package.release.json package.json
cp ../packages/backend/package-lock.json .
npm ci --production
mkdir -p ./node_modules/@kei-crm/frontend
cp -r ../packages/frontend/dist ./node_modules/@kei-crm/frontend/dist 
cp -r ../packages/shared ./node_modules/@kei-crm/shared
cp -r ../packages/backend/prisma ./prisma
cp -r ../packages/backend/dist ./dist
npm run prisma:client:generate
zip -r deploy.zip .
