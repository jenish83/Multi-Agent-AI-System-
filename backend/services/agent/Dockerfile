
FROM node:22-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy agent source code and install its dependencies
COPY services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

# Copy the remaining source code
COPY services/agent ./services/agent
COPY shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD ["npm", "start"]
