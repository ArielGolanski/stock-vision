# Node backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
