# Step 1: Use an official Node.js runtime as a parent image
FROM node:18-slim

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the app's files
COPY . .

# Step 6: Expose the port the app will run on (e.g., 3000)
EXPOSE 80

# Step 7: Define the command to run your app
CMD ["npm", "start"]
