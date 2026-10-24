
FROM node:22-alpine

WORKDIR /app

# Copy and install chat service dependencies
COPY services/chat/package*.json ./services/chat/
WORKDIR /app/services/chat
RUN npm install

# Copy chat service source code
COPY services/chat/ ./

# Copy shared code
WORKDIR /app
COPY shared ./shared

WORKDIR /app/services/chat

EXPOSE 8002

CMD ["npm", "start"]
