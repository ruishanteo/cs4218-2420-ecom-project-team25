
# React Full Stack Project

This is a full-stack application with a **React frontend** and a **Express.js backend**. It allows users to interact with the application through a user-friendly React interface, while the backend handles business logic, database operations, and authentication.

## Table of Contents

- [React Full Stack Project](#react-full-stack-project)
  - [Table of Contents](#table-of-contents)
  - [Continuous Integration](#continuous-integration)
  - [Project Setup](#project-setup)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
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
   npm ci
   ```

## Backend Setup

1. Navigate back to the backend directory (also the root directory of the project):
   ```bash
   cd ..
   ```

2. Install the required dependencies:
   ```bash
   npm ci
   ```

3. Set up environment variables (e.g., database connection, API keys) in a `.env` file. 
   ```
   PORT = 6060
   DEV_MODE = development
   MONGO_URL = 
   JWT_SECRET = 
   BRAINTREE_MERCHANT_ID = 
   BRAINTREE_PUBLIC_KEY = 
   BRAINTREE_PRIVATE_KEY = 
   ```

## Running the Application

After setting up both the frontend and backend:

1. Start the backend server
   ```
   npm run server
   ```
   Your backend API will be running at `http://localhost:6060`.

2. Start the frontend app
   ```
   npm run client
   ```
   Your React application should be running at `http://localhost:3000` (or another available port if `3000` is unavailable).


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

