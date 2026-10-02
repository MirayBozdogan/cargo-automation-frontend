# Cargo Automation Frontend

Frontend application for a cargo automation system that provides user authentication, address management, shipment management, and shipment price calculation.

## Features

* User registration and login
* JWT-based authentication
* User and address management
* Shipment creation and management
* Shipment price calculation
* City and district selection
* Form validation
* API integration with the backend
* Responsive user interface

## Technologies

* **Next.js 16**
* **React**
* **TypeScript**
* **Axios**
* **CSS**
* **ESLint**

## Project Structure

```text
app/
├── users/
├── ...
│
lib/
└── api.ts

public/
```

## Getting Started

### Prerequisites

* Node.js
* npm
* Git

### Clone the Repository

```bash
git clone https://github.com/MirayBozdogan/cargo-automation-frontend.git
cd cargo-automation-frontend
```

### Install Dependencies

```bash
npm install
```

### Backend Configuration

The frontend communicates with the Cargo Automation Backend through the API client configured in:

```text
lib/api.ts
```

Make sure the backend application is running before using the frontend.

### Run the Application

```bash
npm run dev
```

The application will run on:

```text
http://localhost:3000
```

## Related Repository

### Backend

The backend of the project is available here:

[Cargo Automation Backend](https://github.com/MirayBozdogan/cargo-automation-backend?utm_source=chatgpt.com)

## Author

**Miray Bozdoğan**

Computer Engineering Student

[GitHub](https://github.com/MirayBozdogan?utm_source=chatgpt.com) · [LinkedIn](https://www.linkedin.com/in/miraybozdoğan?utm_source=chatgpt.com)
