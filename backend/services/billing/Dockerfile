
FROM node:22-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy billing source code and install its dependencies
COPY services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install

# Copy the remaining source code
COPY services/billing ./services/billing
COPY shared ./shared

WORKDIR /app/services/billing

EXPOSE 8004

CMD ["npm", "start"]
