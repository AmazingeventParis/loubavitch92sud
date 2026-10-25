FROM node:22.23.4-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p data uploads
EXPOSE 80
CMD ["node", "server.js"]
