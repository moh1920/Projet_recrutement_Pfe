FROM node:18 AS build-stage

WORKDIR /app

COPY template/package*.json ./
RUN npm install --legacy-peer-deps

COPY template/. .
RUN npm run build

FROM nginx:alpine

COPY template/nginx.conf /etc/nginx/nginx.conf

COPY --from=build-stage /app/dist/esprit-smart-recruit/browser /usr/share/nginx/html

EXPOSE 80