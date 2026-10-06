FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci
COPY server server
RUN npm run build -w server

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package*.json server/
RUN npm ci --omit=dev -w server
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/seed server/seed
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "server"]
