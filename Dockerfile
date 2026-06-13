FROM node:18-alpine AS builder
ARG VITE_ACCOUNT_API_BASE_URL=http://localhost:8081/api/v2
ARG VITE_PARTY_API_BASE_URL=http://localhost:8083
ENV VITE_ACCOUNT_API_BASE_URL=$VITE_ACCOUNT_API_BASE_URL
ENV VITE_PARTY_API_BASE_URL=$VITE_PARTY_API_BASE_URL
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
