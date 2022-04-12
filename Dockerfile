FROM node:lts-alpine

WORKDIR /app
COPY packages/backend/package.release.json ./package.json
COPY packages/backend/package-lock.json .
RUN npm ci --production

# Copy the prisma client so we don't need to generate it in the docker image (which would require the `prisma` dev dependency)
COPY packages/backend/node_modules/.prisma ./node_modules/.prisma
# Only copy the `dist` dir in frontend, we don't want the "node_modules" to accidentally get copied
COPY packages/frontend/dist ./node_modules/@kei-crm/frontend/dist 
COPY packages/shared ./node_modules/@kei-crm/shared
COPY packages/backend/prisma ./prisma
COPY packages/backend/dist ./dist

EXPOSE 3000
CMD [ "npm", "start" ]
