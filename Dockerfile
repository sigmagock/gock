# Multi-stage build for small image
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm i


FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only what we need
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
# If you want static/public later, add: COPY --from=build /app/public ./public
RUN npm i --omit=dev --ignore-scripts || true
EXPOSE 3000
CMD ["node","dist/server.js"]
