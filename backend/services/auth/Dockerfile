
FROM node:22-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy auth source code and install its dependencies
COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install

# Copy the remaining source code
COPY services/auth ./services/auth
COPY shared ./shared

WORKDIR /app/services/auth

EXPOSE 8001

CMD ["npm", "start"]
