# Stage 1: Build Stage (Based on Alpine for better dependency management)
FROM node:20-alpine AS builder

# Install build dependencies required by native modules like bcrypt
RUN apk add --no-cache python3 make gcc g++ build-base 

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (allows native modules to build)
RUN npm install
# No need for cache clean as we switch stages

# Copy the rest of the application source code
COPY . .

# Stage 2: Production/Run Stage (Minimal runtime image)
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the pre-built node_modules and the application source code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Expose the application port
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]