
# React Full Stack Project

This is a full-stack application with a **React frontend** and a **Express.js backend**. It allows users to interact with the application through a user-friendly React interface, while the backend handles business logic, database operations, and authentication.

## Table of Contents

- [Continuous Integration](#continuous-integration)
- [Project Setup](#project-setup)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Running the Application](#running-the-application)
- [Technologies Used](#technologies-used)
- [License](#license)

## Continuous Integration
CI is setup in this repo to run on merge/pull request to master. 

This [link](https://github.com/cs4218/cs4218-2420-ecom-project-team25/actions/runs/13754148220/job/38458962029) will bring you to the latest CI run for MS1. 



## Project Setup

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/cs4218/cs4218-2420-ecom-project-team25
   ```

2. Navigate to the project directory:
   ```bash
   cd cs4218-2420-ecom-project-team25
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd client
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

Your React application will be running at `http://localhost:6060`.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd ..
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (e.g., database connection, API keys) in a `.env` file. 

4. Start the backend server:
   ```bash
   npm start
   ```

Your backend API will be running at `http://localhost:6060`.

## Running the Application

After setting up both the frontend and backend:

1. Ensure the backend is running (`http://localhost:6060`).
2. Run the frontend (`http://localhost:6060`).
3. The React app will make API calls to the backend.


```

## Technologies Used

- **Frontend**:
  - React
  - React Router
  - Axios (for HTTP requests)
  
- **Backend**:
  - Node.js
  - Express.js
  - MongoDB (using Mongoose for database interaction)
  - JWT (JSON Web Tokens) for authentication

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

