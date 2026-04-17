FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p /storage/data /storage/uploads
EXPOSE 80
CMD ["node", "server.js"]
