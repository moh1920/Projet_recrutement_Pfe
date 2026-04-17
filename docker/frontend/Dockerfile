FROM node:18 AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY /. .
RUN npm run build -- --configuration production

FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build-stage /app/dist/esprit-smart-recruit/browser /usr/share/nginx/html

EXPOSE 80
