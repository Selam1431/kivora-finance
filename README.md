# 💜 Kivora Finance

### Take Control of Your Money. Know Where It Goes.

Ever wonder where your money went at the end of the month?

**Kivora Finance** is built for anyone struggling to manage their money, keep track of spending, or understand where their income goes.

Instead of guessing where your paycheck disappeared, Kivora helps you **track every dollar, understand your spending habits, and make smarter financial decisions** all in one place.

Built with **Java, Spring Boot, and React**, Kivora brings personal finance management into a simple, modern, and easy-to-use application.

### ✨ What Kivora Offers

- **Financial Dashboard** — See your total balance at a glance.
- **Transaction Management** — Track income and expenses in one place.
- **Spending Insights** — Understand where your money is going through financial reports.
- **Search & Filters** — Find transactions by date, vendor, description, or amount.
- **Personalized Settings** — Customize your experience.
- **Data Persistence** — Keep transaction records saved between sessions.
## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React, JavaScript | Interactive user interface |
| **Backend** | Java, Spring Boot | REST APIs and business logic |
| **Data Storage** | CSV | Persistent transaction storage |
| **Build Tool** | Maven | Java dependency management |
| **Testing** | JUnit 5, Spring MockMvc | Backend and API testing |
| **Documentation** | Javadoc, Markdown | Technical documentation |
| **Version Control** | Git, GitHub | Source control and collaboration |

## 🏗️ System Architecture

```text
                  KIVORA FINANCE
                        |
                 React Frontend
                        |
                  HTTP / JSON
                        |
                Spring Boot API
                        |
             +----------+----------+
             |                     |
    TransactionController   ReportController
             |                     |
    TransactionService      ReportService
             |                     |
             +----------+----------+
                        |
                  CSV Storage
```

Kivora uses a layered architecture to separate the frontend, REST API, business logic, and data storage.

The React frontend communicates with Spring Boot through HTTP requests. Controllers handle incoming requests, services process transactions and calculate financial reports, and transaction records are saved in CSV files.
## 🚀 Getting Started

Follow these steps to run Kivora Finance locally.

### Prerequisites

Make sure you have the following installed:

- **Java JDK** — compatible with the version configured in the backend's `pom.xml`
- **Node.js and npm** — to run the React frontend
- **Git** — to clone the repository

The backend includes a Maven Wrapper, so you don't need to install Maven separately.

### 1. Clone the Repository

```bash
git clone https://github.com/Selam1431/kivora-finance.git
cd kivora-finance
```

### 2. Start the Spring Boot Backend

Open a terminal in the project directory:

```bash
cd backend
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

On macOS or Linux:

```bash
./mvnw spring-boot:run
```

The backend provides REST API endpoints for transactions and financial reports.

### 3. Start the React Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access Kivora Finance.

### 4. Run Backend Tests

From the `backend` directory:

```powershell
.\mvnw.cmd test
```

The test suite uses JUnit 5 and Spring MockMvc to verify transaction management, persistence, validation, and API behavior.

---
