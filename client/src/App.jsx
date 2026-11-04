import toast, { Toaster } from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Education",
  "Health", "Salary", "Allowance", "Freelance", "Other",
];

const emptyTransaction = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No date"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function validateName(value) {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length >= 2 &&
    clean.length <= 60 &&
    /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(clean);
}

function passwordStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);


function StatCard({
  title,
  icon,
  iconClass,
  value,
  footer,
  footerClass,
  cardClass,
  decoration,
}) {
  return (
    <article className={cardClass}>
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon ${iconClass}`}>
          {icon}
        </span>
      </div>

      <h2>{value}</h2>

      <div className="stat-foot">
        <span className={footerClass}>{footer}</span>
      </div>

      {decoration && (
        <div className="balance-decoration">₹</div>
      )}
    </article>
  );
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
  () => localStorage.getItem("wealthflow_token") || ""
);
  const [transactions, setTransactions] = useState([]);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const budgetWarningShown = useRef(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setFormMessage("");

      try {
        const response = await fetch(`${API_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load transactions");
        }

        if (!cancelled) {
          setTransactions(
  Array.isArray(data.transactions) ? data.transactions : []
);
        }
      } catch (error) {
        if (!cancelled) {
          setFormMessage(error.message || "Unable to connect to the server");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalIncome = useMemo(
    () => transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const balance = totalIncome - totalExpenses;

  const currentMonthExpenses = useMemo(() => {
  const today = new Date();

  return transactions
    .filter((item) => {
      if (item.type !== "expense" || !item.date) return false;

      const transactionDate = new Date(item.date);

      return (
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}, [transactions]);

const budgetAmount = Number(monthlyBudget) || 0;

const remainingBudget = budgetAmount - currentMonthExpenses;

const budgetProgress =
  budgetAmount > 0
    ? Math.min((currentMonthExpenses / budgetAmount) * 100, 100)
    : 0;

    useEffect(() => {
  if (budgetAmount > 0 && currentMonthExpenses > budgetAmount) {
    if (!budgetWarningShown.current) {
      toast.error(
        `Monthly budget exceeded by ${formatCurrency(
          currentMonthExpenses - budgetAmount
        )}!`
      );

      budgetWarningShown.current = true;
    }
  } else {
    budgetWarningShown.current = false;
  }
}, [budgetAmount, currentMonthExpenses]);

 const categoryExpenses = useMemo(() => {
  const categoryTotals = transactions
    .filter((item) => item.type === "expense")
    .reduce((totals, item) => {
      const category = item.category || "Other";
      totals[category] =
        (totals[category] || 0) + Number(item.amount || 0);
      return totals;
    }, {});

  return Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));
}, [transactions]);

const monthlySummary = useMemo(() => {
  const months = [];
  const today = new Date();
for (let i = 5; i >= 0; i--) {
  const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthTransactions = transactions.filter((item) => {
      if (!item.date) return false;

      const transactionDate = new Date(item.date);

      return (
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });

    const income = monthTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = monthTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    months.push({
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      income,
      expenses,
    });
  }

  return months;
}, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesFilter =
        filter === "all" || item.type === filter;

        const matchesCategory =
  categoryFilter === "all" ||
  item.category === categoryFilter;

  const transactionDate = item.date
  ? new Date(item.date)
  : null;

const formattedDate = item.date
  ? String(item.date).slice(0, 10)
  : "";

const today = new Date();

const transactionDay = transactionDate
  ? new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate()
    )
  : null;

const todayDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

const weekStart = new Date(todayDate);
const dayOfWeek = weekStart.getDay();
weekStart.setDate(
  weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
);

const monthStart = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

const yearStart = new Date(
  today.getFullYear(),
  0,
  1
);

const matchesDate =
  dateFilter === "all" ||
  (dateFilter === "today" &&
    transactionDay?.getTime() === todayDate.getTime()) ||
  (dateFilter === "week" &&
    transactionDay >= weekStart &&
    transactionDay <= todayDate) ||
  (dateFilter === "month" &&
    transactionDate?.getMonth() === today.getMonth() &&
    transactionDate?.getFullYear() === today.getFullYear()) ||
  (dateFilter === "year" &&
    transactionDate?.getFullYear() === today.getFullYear());
  

      const query = search.toLowerCase();
      
console.log("Transaction date:", item.date);
console.log("Date filter:", dateFilter);

      const matchesSearch =
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.category || "").toLowerCase().includes(query);

      return matchesFilter && matchesCategory && matchesDate && matchesSearch;
    });
  }, [transactions, filter, categoryFilter, dateFilter, search]);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      cleanEmail.length > 254
    ) {
      setAuthMessage("Please enter an email address in a valid format.");
      return;
    }

    if (authMode === "register") {
      const cleanName = name.trim().replace(/\s+/g, " ");

      if (!validateName(cleanName)) {
        setAuthMessage(
          "Enter a valid full name using letters, spaces, apostrophes or hyphens."
        );
        return;
      }

      if (
        password.length < 10 ||
        password.length > 72 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
      ) {
        setAuthMessage(
          "Use 10–72 characters with uppercase and lowercase letters, a number, and a symbol."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "register" : "login";

      const body = authMode === "register"
        ? {
            name: name.trim().replace(/\s+/g, " "),
            email: cleanEmail,
            password,
          }
        : { email: cleanEmail, password };

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMessage("Account created! Please log in.");
        setAuthMode("login");
        setName("");
        setPassword("");
      } else {
        localStorage.setItem("wealthflow_token", data.token);
        localStorage.setItem("wealthflow_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setMonthlyBudget(
  localStorage.getItem(`wealthflow_monthly_budget_${data.user.id}`) || ""
);
        setProfileName(data.user?.name || "");
        setProfileEmail(data.user?.email || "");

        setTransactions([]);
        setPage("dashboard");
        setPassword("");
        setAuthMessage("");
        setFormMessage("");
      }
    } catch (error) {
      setAuthMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(event) {
    event.preventDefault();
    setFormMessage("");

    const amount = Number(transactionForm.amount);

    
const title = transactionForm.title.trim();
const digitCount = (title.match(/\d/g) || []).length;

if (/^\d+$/.test(title)) {
  const message = "Transaction title cannot contain only numbers.";
  setFormMessage(message);
  toast.error(message);
  return;
}

if (
  title.length < 2 ||
  title.length > 100 ||
  !/[A-Za-z]/.test(title) ||
  digitCount > 2 ||
  !Number.isFinite(amount) ||
  amount <= 0 ||
  !transactionForm.category
) {
  setFormMessage(
    "Enter a title with at least one letter and no more than 2 digits, plus a valid amount and category."
  );
  return;
}


    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...transactionForm,
            title: transactionForm.title.trim(),
            amount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add transaction");
      }

      setTransactions((current) => [data.transaction, ...current]);

      setTransactionForm({
        ...emptyTransaction,
        date: new Date().toISOString().slice(0, 10),
      });

      setFormMessage("Transaction added successfully.");
      toast.success("Transaction added successfully!");
      
      setPage("transactions");
    } catch (error) {
      toast.error(error.message || "Unable to add transaction.");
    } finally {
      setLoading(false);
    }
  }

  
  async function handleDeleteTransaction(transactionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setFormMessage("");

      const response = await fetch(
        `${API_URL}/api/transactions/${transactionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete transaction."
        );
      }

      setTransactions((current) =>
        current.filter(
          (transaction) => transaction._id !== transactionId
        )
      );

      toast.success("Transaction deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Unable to delete transaction.");
    }
  }


  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage("");

    const cleanName = profileName.trim().replace(/\s+/g, " ");

    if (!validateName(cleanName)) {
      setProfileMessage("Please enter a valid full name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: cleanName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update profile");
      }

      const updatedUser = data.user || data;

      setUser((current) => ({
        ...current,
        ...updatedUser,
        name: updatedUser.name || cleanName,
      }));

      setProfileName(updatedUser.name || cleanName);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(
        error.message === "Failed to fetch"
          ? "Profile saving needs the backend profile endpoint."
          : error.message || "Could not update profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function askAI(event) {
    event.preventDefault();
    setAiMessage("");
    setAiAnswer("");

    if (!aiQuestion.trim()) {
      setAiMessage("Type a question about your spending or budget first.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: aiQuestion.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI assistant request failed");
      }

      setAiAnswer(data.answer || data.message || "No answer was returned.");
    } catch (error) {
      setAiMessage(
        error.message === "Failed to fetch"
          ? "The AI backend route is not set up yet. Add it to Express before using the assistant."
          : error.message || "Unable to reach the AI assistant."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function logout() {
  localStorage.removeItem("wealthflow_token");
localStorage.removeItem("wealthflow_user");
    setToken("");
    setUser(null);
    setTransactions([]);
    setPassword("");
    setName("");
    setEmail("");
    setAuthMessage("");
    setFormMessage("");
    setProfileMessage("");
    setAiAnswer("");
    setAiMessage("");
    setPage("dashboard");
    setAuthMode("login");
  }

  function updateTransactionField(event) {
    const { name: field, value } = event.target;
    setTransactionForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (!token || !user) {
    const strength = passwordStrength(password);

    return (
      <main className="auth-page">
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />

        <section className="auth-card glass-panel">
          <div className="brand brand-center">
            <div className="brand-mark">W</div>
            <div>
              <h1>WealthFlow</h1>
              <p>Personal finance, made clearer.</p>
            </div>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">YOUR MONEY. YOUR CONTROL.</span>
            <h2>
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>
            <p>
              {authMode === "login"
                ? "Sign in to see your financial overview."
                : "Start organising your income and expenses."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "register" && (
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  placeholder="e.g.Kumar"
                  value={name}
                  onChange={(event) =>setName(event.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ""))
}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>

             <div className="field">
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  authMode === "register"
                    ? "Create a strong password"
                    : "Your password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  authMode === "login"
                    ? "current-password"
                    : "new-password"
                }
                minLength={authMode === "register" ? 10 : 1}
                maxLength={72}
                required
              />
            

           <button
  type="button"
  className="password-toggle"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Hide password" : "Show password"}
>
  {showPassword ? (
    <svg viewBox="0 0 24 24" width="20" height="20"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 7 9 7a15 15 0 0 1-3 3.7" />
      <path d="M6.2 6.2C4.1 7.6 3 12 3 12s4 7 9 7a10 10 0 0 0 3-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>
</div>
</div>

            {authMode === "register" && (
              <div className="password-hint">
                <span>
                  Password strength:{" "}
                  {password.length === 0
                    ? "Not entered"
                    : strength <= 2
                    ? "Weak"
                    : strength <= 4
                    ? "Good"
                    : "Strong"}
                </span>
                <span className="password-rules">
                  10+ characters, uppercase, lowercase, number and symbol.
                </span>
              </div>
            )}

            {authMessage && (
              <p className="notice" role="status">{authMessage}</p>
            )}

            <button className="primary-button full-button" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Sign in to WealthFlow →"
                : "Create account →"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "New to WealthFlow?"
              : "Already have an account?"}{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthMessage("");
                setPassword("");
              }}
            >
              {authMode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="secure-note">
            ✦ Your personal finance workspace
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" />
      <aside className="sidebar glass-panel">
        <div className="brand">
          <div className="brand-mark">W</div>
          <span>WealthFlow</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="side-nav">
          <button
            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            <span className="nav-icon">⌂</span>
            Dashboard
          </button>


          <button
            className={`nav-item ${page === "transactions" ? "active" : ""}`}
            onClick={() => setPage("transactions")}
          >
            <span className="nav-icon">↔</span>
            Transactions
          </button>
          <button
  className={`nav-item ${page === "profile" ? "active" : ""}`}
  onClick={() => setPage("profile")}
>
  <span className="nav-icon">👤</span>
  Profile & Settings
</button>

          <button
            className={`nav-item ${page === "add" ? "active" : ""}`}
            onClick={() => setPage("add")}
          >
            <span className="nav-icon">＋</span>
            Add transaction
          </button>

          <button
            className={`nav-item ${page === "ai" ? "active" : ""}`}
            onClick={() => setPage("ai")}
          >
            <span className="nav-icon">✦</span>
            AI assistant
          </button>
        </nav>

        <p className="sidebar-label">ACCOUNT</p>

        <nav className="side-nav">
          <button
            className={`nav-item ${page === "profile" ? "active" : ""}`}
            onClick={() => setPage("profile")}
          >
            <span className="nav-icon">◎</span>
            My profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✦</span>
            <strong>Your money, your future.</strong>
            <p>Small steps today create a better tomorrow.</p>
          </div>

          <div className="user-card">
            <div className="avatar">
  {(user.name || user.email || "U").charAt(0).toUpperCase()}
</div>
            <button
              className="logout-button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {page}</p>
            <h2>
              {page === "dashboard" && "Dashboard"}
              {page === "transactions" && "Transactions"}
              {page === "add" && "Add transaction"}
              {page === "profile" && "My profile"}
              {page === "ai" && "AI money assistant"}
            </h2>
          </div>

          <button
            className="primary-button top-add-button"
            onClick={() => {
              setPage("add");
              setNotice("");
            }}
          >
            + Add transaction
          </button>
        </header>

        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}

        {page === "dashboard" && (
          <>
            <section className="welcome-row">
              <div>
                <h1>Welcome back, {user.name?.split(" ")[0] || "there"} 👋</h1>
                <p>Here’s an overview of your personal finances.</p>
              </div>

              <div className="date-chip">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </section>

                <section className="stats-grid">
  <StatCard
    title="Total balance"
    icon="₹"
    iconClass=""
    value={formatCurrency(balance)}
    footer="Income minus expenses"
    footerClass="neutral-text"
    cardClass="stat-card balance-card glass-panel"
    decoration={true}
  />

  <StatCard
    title="Total income"
    icon="↗"
    iconClass="income-icon"
    value={formatCurrency(totalIncome)}
    footer="Money received"
    footerClass="income-text"
    cardClass="stat-card glass-panel"
  />

  <StatCard
    title="Total expenses"
    icon="↘"
    iconClass="expense-icon"
    value={formatCurrency(totalExpenses)}
    footer="Money spent"
    footerClass="expense-text"
    cardClass="stat-card glass-panel"
  />
  <section className="content-card glass-panel budget-card">
  <div className="section-heading">
    <div>
      <p className="eyebrow">MONTHLY BUDGET</p>
      <h3>Track Your Spending</h3>
    </div>
  </div>

  <div>
    <label>Set your monthly budget (₹)</label>
    <input
      type="number"
      min="1"
      placeholder="Enter monthly budget"
      value={monthlyBudget}
      
    onChange={(e) => {
  const value = e.target.value;
  setMonthlyBudget(value);

  if (user?.id) {
    localStorage.setItem(
      `wealthflow_monthly_budget_${user.id}`,
      value
    );
  }
}}/>
  </div>

  {budgetAmount > 0 && (
    <div>
      <p>
        Spent: {formatCurrency(currentMonthExpenses)}
      </p>
      <p>
        Remaining: {formatCurrency(remainingBudget)}
      </p>

      <div
        style={{
          width: "100%",
          height: "12px",
          background: "#e5e7eb",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${budgetProgress}%`,
            height: "100%",
            background: remainingBudget < 0 ? "#ef4444" : "#22c55e",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p>
        {remainingBudget < 0
          ? "You have exceeded your monthly budget."
          : `${budgetProgress.toFixed(1)}% of your budget used`}
      </p>
    </div>
  )}
</section>
</section>

            <section className="content-card glass-panel monthly-chart-card">
  <div className="section-heading">
    <div>
      <p className="eyebrow">FINANCIAL OVERVIEW</p>
      <h3>Monthly Income vs Expenses</h3>
    </div>
    <span className="chart-period">Last 6 months</span>
  </div>

  <div className="chart-legend">
    <span><i className="legend-income"></i> Income</span>
    <span><i className="legend-expense"></i> Expenses</span>
  </div>

  <div className="monthly-chart">
    {monthlySummary.map((month) => {
      const maxValue = Math.max(
        ...monthlySummary.flatMap((item) => [
          item.income,
          item.expenses,
        ]),
        1
      );

      return (
        <div className="chart-month" key={month.label}>
          <div className="chart-bars">
            <div
              className="chart-bar income-bar"
              style={{
                height: `${(month.income / maxValue) * 100}%`,
              }}
              title={`Income: ${formatCurrency(month.income)}`}
            ></div>

            <div
              className="chart-bar expense-bar"
              style={{
                height: `${(month.expenses / maxValue) * 100}%`,
              }}
              title={`Expenses: ${formatCurrency(month.expenses)}`}
            ></div>
          </div>

          <span className="chart-month-label">{month.label}</span>
        </div>
      );
    })}
  </div>
</section>



{/* Category-wise Expense Pie Chart */}
<section className="content-card glass-panel">
  <div className="section-heading">
    <div>
      <p className="eyebrow">SPENDING BREAKDOWN</p>
      <h3>Expenses by Category</h3>
    </div>
  </div>

  {categoryExpenses.length > 0 ? (
    <div className="category-chart-layout">
      <div
        className="category-pie-chart"
        style={{
          background: `conic-gradient(${categoryExpenses.map((item, index) => {
            const colors = [
              "#3b82f6",
              "#ef4444",
              "#10b981",
              "#f59e0b",
              "#8b5cf6",
              "#ec4899",
              "#06b6d4",
              "#64748b",
            ];

            const total = categoryExpenses.reduce(
              (sum, entry) => sum + Number(entry.value || 0),
              0
            );

            const start =
              (categoryExpenses
                .slice(0, index)
                .reduce(
                  (sum, entry) => sum + Number(entry.value || 0),
                  0
                ) / total) * 100;

            const end =
              start + (Number(item.value || 0) / total) * 100;

            return `${colors[index % colors.length]} ${start}% ${end}%`;
          }).join(", ")})`,
        }}
      />

      <div className="category-chart-legend">
        {categoryExpenses.map((item, index) => {
          const colors = [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
            "#64748b",
          ];

          return (
            <div className="category-legend-item" key={item.name}>
              <span
                className="category-legend-color"
                style={{
                  backgroundColor: colors[index % colors.length],
                }}
              />
              <span>{item.name}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <p>No expense data available yet.</p>
  )}
</section>

<section className="content-card glass-panel">
  <div className="section-heading">

            
                <div>
                  <p className="eyebrow">YOUR ACTIVITY</p>
                  <h3>Recent transactions</h3>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => setPage("transactions")}
                >
                  View all →
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">↔</div>
                  <h3>No transactions yet</h3>
                  <p>Add your first income or expense to get started.</p>
                  <button
                    className="primary-button"
                    onClick={() => setPage("add")}
                  >
                    + Add your first transaction
                  </button>
                </div>
              ) : (
                <div className="transaction-list">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      className="transaction-row"
                      key={transaction._id}
                    >
                      <div
                        className={`transaction-symbol ${
                          transaction.type === "income"
                            ? "symbol-income"
                            : "symbol-expense"
                        }`}
                      >
                        {transaction.type === "income" ? "↙" : "↗"}
                      </div>

                      <div className="transaction-description">
                        <strong>{transaction.title}</strong>
                        <span>
                          {transaction.category || "Other"} ·{" "}
                          {formatDate(transaction.date)}
                        </span>
                      </div>

                      <strong
                        className={`transaction-amount ${
                          transaction.type === "income"
                            ? "income-text"
                            : "expense-text"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatCurrency(transaction.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {page === "transactions" && (
          <section className="content-card glass-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR MONEY</p>
                <h3>All transactions</h3>
              </div>
              <span>{filteredTransactions.length} records</span>
            </div>

            <div className="transaction-tools">
              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <select
                className="filter-select"
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value)
                  setCategoryFilter("all")

                }}
                aria-label="Filter transactions"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>

              
<select
  className="filter-select"
  value={categoryFilter}
  onChange={(event) => setCategoryFilter(event.target.value)
  }
  aria-label="Filter by category"
>
  <option value="all">All categories</option>

  {[...new Set(
  transactions
    .filter((item) =>
      filter === "all" || item.type === filter
    )
    .map((item) => item.category)
    .filter(Boolean)
)].sort().map((category) => (
  <option key={category} value={category}>
    {category}
  </option>
))}
</select>

<select
  className="filter-select"
  value={dateFilter}
  onChange={(event) => setDateFilter(event.target.value)}
  aria-label="Filter transactions by date"
>
  <option value="all">All dates</option>
  <option value="today">Today</option>
  <option value="week">This week</option>
  <option value="month">This month</option>
  <option value="year">This year</option>
</select>


            </div>

            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <h3>No matching transactions</h3>
                <p>Try another search or add a new transaction.</p>
              </div>
            ) : (
              <div className="transaction-list">
                {filteredTransactions.map((transaction) => (
                  <div
                    className="transaction-row"
                    key={transaction._id}
                  >
                    <div
                      className={`transaction-symbol ${
                        transaction.type === "income"
                          ? "symbol-income"
                          : "symbol-expense"
                      }`}
                    >
                      {transaction.type === "income" ? "↙" : "↗"}
                    </div>

                    <div className="transaction-description">
                      <strong>{transaction.title}</strong>
                      <span>
                        {transaction.category || "Other"} ·{" "}
                        {formatDate(transaction.date)}
                      </span>
                    </div>

                    <strong
                      className={`transaction-amount ${
                        transaction.type === "income"
                          ? "income-text"
                          : "expense-text"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "−"}
                      
{formatCurrency(transaction.amount)}
</strong>

<button
  type="button"
  className="delete-transaction-btn"
  onClick={() => handleDeleteTransaction(transaction._id)}
>
  Delete
</button>
</div>

                ))}
              </div>
            )}
          </section>
        )}

        {page === "add" && (
          <section className="form-card glass-panel">
            <div className="large-card-icon">↔</div>

            <p className="eyebrow">RECORD YOUR MONEY</p>
            <h3>Add a transaction</h3>
            <p className="form-intro">
              Keep your finances up to date by recording income and expenses.
            </p>

            
<form className="transaction-form" onSubmit={handleAddTransaction}>
  <div className="type-selector">
    <button
      type="button"
      className={`type-option ${transactionForm.type === "expense" ? "selected" : ""}`}
      onClick={() =>
        setTransactionForm((current) => ({
          ...current,
          type: "expense",
          category: "Food",
        }))
      }
    >
      ↗ Expense
    </button>

    <button
      type="button"
      className={`type-option ${transactionForm.type === "income" ? "selected" : ""}`}
      onClick={() =>
        setTransactionForm((current) => ({
          ...current,
          type: "income",
          category: "Salary",
        }))
      }
    >
      ↙ Income
    </button>
  </div>

  <label className="field">
    <span>Transaction title</span>
    <input
      type="text"
      name="title"
      value={transactionForm.title}
      
onChange={(event) => {
  const value = event.target.value;

  if (/^[A-Za-z0-9 ]*$/.test(value)) {
    setTransactionForm((current) => ({
      ...current,
      title: value,
    }));
  }
}}

      placeholder="e.g. Monthly salary or groceries"
      maxLength={100}
      required
    />
  </label>

  <div className="form-row">
    <label className="field">
      <span>Amount (₹)</span>
      <input
        type="number"
        name="amount"
        value={transactionForm.amount}
        onChange={updateTransactionField}
        placeholder="0.00"
        min="0.01"
        max="100000000"
        step="0.01"
        required
      />
    </label>

    <label className="field">
      <span>Category</span>
      <select
        name="category"
        value={transactionForm.category}
        onChange={updateTransactionField}
        required
      >
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </label>
  </div>

  <label className="field">
    <span>Date</span>
    <input
      type="date"
      name="date"
      value={transactionForm.date}
      onChange={updateTransactionField}
      max={new Date().toISOString().slice(0, 10)}
      required
    />
  </label>

  {formMessage && (
    <p className="notice" role="status">{formMessage}</p>
  )}

  <button
    className="primary-button full-button"
    type="submit"
    disabled={loading}
  >
    {loading ? "Saving..." : "Save transaction →"}
  </button>
</form>

          </section>
        )}

        {page === "profile" && (
          <section className="form-card glass-panel">
            <div className="large-card-icon">◎</div>

            <p className="eyebrow">ACCOUNT SETTINGS</p>
            <h3>Your profile</h3>
            <p className="form-intro">
              Update your personal details and keep your account information
              current.
            </p>

            <form className="transaction-form" onSubmit={saveProfile}>
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(event) =>setProfileName(event.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ""))
}
                  maxLength={80}
                  required
                />
              </label>

              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  maxLength={254}
                  required
                />
              </label>

              <button className="primary-button full-button" type="submit">
                Save profile
              </button>
            </form>

            <div className="profile-security">
              <h4>Account security</h4>
              <p>
                Use a unique password and never share your login credentials.
              </p>
              <button
                className="secondary-button"
                onClick={logout}
                type="button"
              >
                Log out of WealthFlow
              </button>
            </div>
          </section>
        )}

        {page === "ai" && (
          <section className="form-card glass-panel ai-card">
            <div className="large-card-icon">✦</div>

            <p className="eyebrow">SMART MONEY TOOLS</p>
            <h3>AI money assistant</h3>
            <p className="form-intro">
              Ask for general budgeting ideas based on your financial
              information.
            </p>

            <div className="ai-suggestions">
              {[
                "How can I reduce my expenses?",
                "Help me create a monthly budget.",
                "What should I know about saving money?",
              ].map((suggestion) => (
                <button
                  className="secondary-button"
                  key={suggestion}
                  type="button"
                  onClick={() => setAiQuestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="ai-form" onSubmit={askAI}>
              <label className="field">
                <span>Your question</span>
                <textarea
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder="Ask something about budgeting or saving..."
                  rows={4}
                  maxLength={1000}
                  required
                />
              </label>

              <button
                className="primary-button full-button"
                type="submit"
                disabled={aiLoading}
              >
                {aiLoading ? "Thinking..." : "Ask AI assistant ✦"}
              </button>
            </form>

            {aiAnswer && (
              <div className="ai-answer">
                <h4>Assistant response</h4>
                <p>{aiAnswer}</p>
              </div>
            )}

            <p className="ai-disclaimer">
              AI responses can be inaccurate. Use them for general information,
              not as guaranteed financial advice. Avoid entering passwords,
              bank account numbers, or other sensitive details.
            </p>
          </section>
        )}

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} WealthFlow</span>
          <span>Build healthy money habits, one step at a time.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

