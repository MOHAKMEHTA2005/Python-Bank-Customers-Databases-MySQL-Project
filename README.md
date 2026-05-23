# 🌌 Aura Bank | Customer Database System

A premium, full-stack Single Page Web Application (SPA) designed to manage, record, search, and audit bank customer profiles. Rebuilt, optimized, and modernized from an educational Python-MySQL CLI script into a high-performance database administrative portal.

Featuring an elegant glassmorphism dark-mode UI, real-time statistics widgets, interactive data visualization, full-spectrum CRUD controls, and a high-fidelity printable statement report generator.

---

## 🌟 Key Features

*   **⚡ Dual-Database Adaptability**: Aura Bank is built with a hybrid database layer. By default, it runs **SQLite** out-of-the-box with **zero manual configuration** required. Users can transition to a production-scale **MySQL Relational Database** at any time via the Database Settings panel in the web interface.
*   **📊 Interactive Analytics Dashboard**: Renders real-time aggregate statistics (Total depositors, total balance volume, average customer deposits) alongside an animated **Chart.js** donut chart representing account category distributions.
*   **🔒 Safe Prepared Statements**: Employs parameterized SQL queries across both SQLite and MySQL backends, entirely mitigating vulnerabilities related to SQL Injection.
*   **📋 High-Fidelity Official Statements**: Includes a printable, styled account statement report modeled on the **State Bank of India (Model Town, Delhi Branch)** layout. The system automatically translates numerical floating-point balances into professional written Indian Rupee words (e.g. *Rupees Fifty-Two Thousand Only*).
*   **📝 Full-Spectrum CRUD Panel**: Smooth, responsive forms to create, edit, search, filter, and delete customer records dynamically without triggering full browser window reloads.
*   **⚙️ Intelligent Automation**: Built-in logical account number utility that auto-scans database indices to generate and increment the next valid account number upon registration.

---

## 📂 Project Anatomy

```text
Python-Bank-Customers-Databases-MySQL-Project/
├── Python Bank Customers Databases + MySQL Project/   # Original legacy console CLI assets
│   ├── Instructions.txt
│   └── Python Bank Customers Databases.py
├── app.py                                             # Flask REST backend server
├── db_manager.py                                      # Hybrid database driver (SQLite/MySQL)
├── requirements.txt                                   # Python dependencies list
├── bank.db                                            # Generated SQLite database file (created automatically)
├── db_config.json                                     # Active database connection credentials (created automatically)
├── templates/
│   └── index.html                                     # Front-end Single Page Application layout
└── static/
    ├── css/
    │   └── style.css                                  # Custom HSL glassmorphic design and print media rules
    └── js/
        └── app.js                                     # Dynamic view router, fetch triggers, and statement generators
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have the following installed on your machine:
*   [Python 3.8+](https://www.python.org/downloads/)
*   [Pip](https://pip.pypa.io/en/stable/installation/) (Python Package Installer)
*   *Optional:* A running MySQL Server (only if you wish to toggle out of SQLite)

---

### 💻 Step-by-Step Installation

#### 1. Clone the Repository
Clone the codebase from GitHub using terminal command:
```bash
git clone https://github.com/MOHAKMEHTA2005/Python-Bank-Customers-Databases-MySQL-Project.git
cd Python-Bank-Customers-Databases-MySQL-Project
```

#### 2. Install Dependencies
Install all required libraries specified in the requirements manifest:
```bash
pip install -r requirements.txt
```

#### 3. Spin Up the Web Server
Launch the Flask development server:
```bash
python app.py
```
Upon successful boot, you will see server addresses outputted in your console:
```text
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

#### 4. Launch the Dashboard
Open your preferred web browser and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## ⚙️ Configuring Database Engines

### 📁 1. Local SQLite Storage (Default)
On your initial boot, Aura Bank automatically initializes a local file called `bank.db` and structures the `Customers` relational table. No additional steps are necessary! You can start adding and editing customer records immediately.

### 🐬 2. Production MySQL Relational Database
To connect the application to your local or cloud MySQL server:
1.  Navigate to the **DB Configuration** tab in the sidebar menu.
2.  Select **MySQL Database** as your active engine.
3.  Fill in your server credentials:
    *   **Host**: `localhost` (or IP address of your remote database server)
    *   **User**: `root`
    *   **Password**: *Your MySQL server password*
    *   **Schema Name**: `Bank_Customers_Database` (The application will auto-create this schema if it does not exist)
4.  Click **Test Connection** to verify connection settings.
5.  Click **Apply & Save Connection** to save configuration credentials in the local `db_config.json` secure file. Aura Bank will transition the active storage session to MySQL instantly!

---

## 📋 Banking Statement Auditing
Generating reports is extremely straightforward:
1.  Open the **Reports & Statements** tab in the sidebar.
2.  Select a registered customer from the search dropdown.
3.  Click **Generate Statement** to review the official banking report sheet.
4.  To save as a PDF or print a hard-copy, click **Print Statement** (or press `Ctrl + P`). Standard margins and clean black-and-white print styles will apply automatically.

---

## 🛠️ Built With

*   **Backend**: Python Flask Micro-Framework, SQLite3, mysql-connector-python
*   **Frontend**: Native Semantic HTML5, Vanilla HSL CSS3, ES6+ Fetch APIs
*   **Data Visualization**: Chart.js
*   **Typography**: Google Font `Outfit`

---

## 📄 License & Original Attribution
This project was refactored and enhanced from the original educational console application. All rights to original instructions and educational assets are preserved under the `/Python Bank Customers Databases + MySQL Project` subdirectory.
