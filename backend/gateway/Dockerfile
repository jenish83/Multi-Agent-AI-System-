
FROM node:22-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy gateway source code and install its dependencies
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm install

# Copy the remaining source code
COPY gateway ./gateway
COPY shared ./shared

WORKDIR /app/gateway

EXPOSE 8000

CMD ["npm", "start"]
