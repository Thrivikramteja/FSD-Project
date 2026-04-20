# Use Node.js 20 Alpine for a lightweight image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the Express API port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]