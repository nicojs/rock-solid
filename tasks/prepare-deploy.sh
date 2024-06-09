set -e

rm -rf .deploy
mkdir .deploy

cd .deploy
mkdir packages
cp -r ../packages/* ./packages
rm -rf ./packages/*/node_modules
cp ../package.json .
cp ../package-lock.json .
npm ci --omit=dev
npm run -w packages/backend prisma:client:generate
zip -r deploy.zip .
