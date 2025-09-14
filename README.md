# Personal Financial Calculator - Desktop Application

## 📝 About the Project

This is a complete desktop application for personal financial management, created to replace complex spreadsheets and offer a simpler and more intuitive user experience. The project was developed to help manage daily expenses, credit card bills, and financial goals in a visual and organized way.

The application works 100% offline and is self-contained, with a single executable for Windows.

---

## ✨ Main Features

* **Dashboard (Overview):** A home screen with KPIs (Key Performance Indicators) that summarize the month's financial impact, including total spending, total card payments, and total debit payments.
* **Interactive Charts:** Visual analysis of spending by category, with filters by payment type (debit/card) and person responsible. * **Invoice Management:** A dedicated screen to view the invoice history for each credit card, with precise calculation of the purchase period based on the closing date.
* **Installment Control:** Full support for installment purchases, with installments correctly allocated to their respective invoices.
* **Goal Management:** Create and track the progress of financial goals, such as travel or large purchases.
* **Complete CRUD:** Functionality for adding, editing, and deleting expenses, categories, and cards, always maintaining the integrity of the financial history (soft delete).

---

## 🚀 Technologies Used

This project was built with a modern stack, combining the robustness of Python on the backend with the reactivity of React on the frontend.

* **Backend:**
* **Python 3.10+**
* **FastAPI:** For building the REST API. * **SQLAlchemy:** As an ORM for database communication.
* **SQLite:** As a single-file database, ideal for a desktop application.

* **Frontend:**
* **React:** For building the user interface.
* **Vite:** As a build tool and development server.
* **Material-UI (MUI):** For the visual component library.
* **Recharts:** For creating charts.

* **Desktop Packaging:**
* **PyInstaller:** To package the backend, frontend, and all dependencies into a single executable (`.exe`).
* **pywebview:** To create the native Windows window that displays the React interface.

---

## 🛠️ How to Generate the Executable (`.exe`)

To compile the project and generate the Windows installer, follow the steps below.

### Prerequisites
* Python 3.10+ installed and added to your PATH.
* Node.js and npm installed.

### Step by Step

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/your-repository.git](https://github.com/your-username/your-repository.git)
cd your-repository
```

2. **Create and activate a virtual environment for Python:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

3. **Install the backend dependencies:**
```bash
pip install -r backend/requirements.txt
pip install pywebview pyinstaller
```

4. **Install the dependencies and compile the frontend:**
```bash
cd frontend
npm install
npm run build
cd ..
```

5. **Generate the executable With PyInstaller:**
In the project root folder, run the command:
```bash
pyinstaller --name "CalculadoraFinanceira" --onefile --add-data "frontend/dist;frontend/dist" --add-data "backend;backend" --hidden-import "uvicorn.lifespan.on" --hidden-import "uvicorn.loops.auto" --hidden-import "uvicorn.protocols.http.auto" run_desktop_app.py
```

6. **Done!** The final executable will be in the `dist` folder that was created in the project root.
