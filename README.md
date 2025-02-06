# Tabulation WebApp

This is a Node.js application designed to manage and display results for a judging system. It includes endpoints for viewing the judging page, controlling the results, and setting up configurations.

## Endpoints

1. **Home Endpoint (Judging Page)**  
   `GET /`  
   Displays the main page for the judging system where judges can enter their scores.

2. **Control Endpoint (Results)**  
   `GET /control`  
   Shows the results of the judging system.

3. **Setup Endpoint (Configuration)**  
   `GET /setup`  
   Provides an interface for configuring the system.

## Running the Application with Docker

### Step 1: Build the Docker Image

Make sure you have the `Dockerfile` in the project directory. Open a terminal in the root of your project and run the following command to build the Docker image:

```bash
docker build -t tabulation-webapp .
```

### Step 2: Run the Docker Container

Run the app in a Docker container and expose it on port 80 with this command:

```bash
docker run -p 80:3000 --name tabulation-container tabulation-webapp
```

This will start the container and expose the app at `http://localhost` in your browser.

### Step 3: Access the Application

Once the container is running, you can access the app via the following URLs:

- **Judging Page**: [http://localhost](http://localhost)
- **Results Page**: [http://localhost/control](http://localhost/control)
- **Setup Page**: [http://localhost/setup](http://localhost/setup)

## Additional Information

- The app is built with Node.js and uses Express for routing.
- You can configure the system via the `/setup` endpoint and view the results at `/control`.
  
Enjoy using the Tabulation WebApp!

```

### Key Features:
- The **endpoints** section clearly outlines the functionality of each route (`/`, `/control`, `/setup`).
- **Docker build and run instructions** are provided to guide you through the process of containerizing and running the app, including exposing port 80.

Let me know if you need any changes or additions!
