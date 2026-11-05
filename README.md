# WealthFlow – Personal Finance Tracker

A full-stack personal finance management application that helps users track income, expenses, monitor spending habits, and manage monthly budgets through an interactive dashboard.

## 🚀 Features

- **User Authentication:** Secure registration and login using JWT authentication.
- **Dashboard:** View total income, expenses, and available balance.
- **Transaction Management:** Add, view, and delete income and expense records.
- **Transaction Filters:** Search and filter transactions by type, category, and date.
- **Visual Analytics:** Interactive charts for monthly income, expenses, and spending categories.
- **Monthly Budget Tracking:** Monitor monthly expenses against a set budget.
- **AI Assistance:** AI-powered assistance using Google Gemini API.
- **Responsive Design:** User-friendly interface across desktop and mobile devices.
- **Password Visibility:** Show or hide password while logging in or registering.

## 🛠️ Technologies Used

| Category | Technology |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT |
| AI Integration | Google Gemini API |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## 📁 Project Structure

```text
WealthFlow/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/varunk27112004-ops/WealthFlow.git
```

### 2. Install frontend dependencies

```bash
cd WealthFlow/client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd WealthFlow/server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with your own credentials. Never upload your `.env` file to GitHub.

### 5. Run the backend

From the server directory:

```bash
npm start
```

### 6. Run the frontend

From the client directory:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🌐 Live Application

- **Frontend:** [WealthFlow Live Application](https://wealth-flow.vercel.app/)
- **Backend:** https://wealthflow-api-49af.onrender.com
- **GitHub Repository:** https://github.com/varunk27112004-ops/WealthFlow

## 🎯 Project Objective

The objective of WealthFlow is to provide a simple and accessible platform for managing personal finances. It helps users understand their financial activities, monitor spending patterns, and make better budgeting decisions.

## 👨‍💻 Developer

**Varun K.**

GitHub: [varunk27112004-ops](https://github.com/varunk27112004-ops)

---

*WealthFlow – Track Your Money. Understand Your Spending. Manage Your Future.*