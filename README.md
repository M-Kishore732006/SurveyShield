# SurveyShield: AI-Powered Survey Data Quality Assurance

SurveyShield is a modern, enterprise-grade data validation platform designed to detect logical discrepancies, fraud, and statistical outliers in field-collected survey datasets. Built using a distributed microservices architecture, the application combines a robust **MERN (MongoDB, Express.js, React, Node.js)** core with a high-performance **FastAPI Machine Learning service**.

---

## 🚀 Presentation Outline & Project Overview

### 1. The Problem Statement
Field surveys are often plagued by:
* **Human Errors:** Enumerators making typos or inputting out-of-range dates and ages.
* **Logical Inconsistencies:** Contradicting answers (e.g., reporting active working hours while claiming to be unemployed).
* **Fabricated Data (Fraud):** Data entered artificially that doesn't follow natural distribution patterns.
* **Manual Auditing Bottlenecks:** Quality assurance teams manually inspecting spreadsheets, which is slow and prone to oversight.

### 2. The SurveyShield Solution
SurveyShield automates quality assurance through a **hybrid validation engine**:
* **Deterministic Checks (Rule-Based):** Immediate checks on logical bounds and data sanity.
* **Probabilistic Checks (Machine Learning):** Unsupervised outlier detection targeting structural anomalies and fraudulent inputs.
* **Unified Dashboard:** Dynamic visual metrics, audit logs, role-based workflows, and detailed audit trails.

---

## 🛠️ System Architecture & Data Flow

```mermaid
graph TD
    A[Enumerator (CSV Upload)] -->|Post Request| B(Node.js Backend)
    B -->|Preprocess & Extract Fields| C{FastAPI ML Service}
    B -->|Apply Deterministic Rules| D[Rule Risk Score]
    C -->|Isolation Forest Inference| E[Anomaly Score & Explanations]
    D & E -->|Weighted Consolidation| F[Combined Risk Score]
    F -->|Flagged / Validated Status| G[(MongoDB Database)]
    G -->|Real-time Metrics| H[Admin Dashboard]
    G -->|Interactive Auditing| I[Enumerator Workspace]
```

1. **Upload:** Enumerators upload survey CSV files via their dashboard.
2. **Preprocessing:** Node.js parses the CSV, validates structure, and maps local villages to the database.
3. **ML Prediction:** The cleaned dataset is sent as a batch to the FastAPI ML Microservice.
4. **Weighted Consolidation:** 
   * **Rule Risk Score** ($30\%$ weight) represents logical violations.
   * **ML Anomaly Score** ($70\%$ weight) represents statistical variance.
   * **Combined Risk Score** determines if a record is `Normal`, `Low Risk` (Validated), `Medium Risk` (Flagged / Warning), or `High Risk` (Flagged / Critical).
5. **Storage & Review:** Stored in MongoDB. Admins review flagged records and can approve, request re-verification, or confirm anomalies.

---

## 🧠 Core Algorithms & Validation Logic

### A. Rule-Based Validation (Logical Constraints)
Applies deterministic boundaries to catch inputs that are mathematically or logically impossible:
* **Age Out of Bounds:** Enforces age boundaries ($0 \le \text{age} \le 120$).
* **Negative Income:** Flags negative monetary values.
* **Working Hours Boundary:** Enforces weekly working hours limits ($0 \le \text{hours} \le 168$).
* **Household Size Consistency:** Enforces size constraints ($>0$).
* **Logical Cross-Checks:** Flags contradicting fields, e.g., if `employment_status === 'unemployed'` but `hours_worked > 0`.
* **Flexible Date Parsing:** Validates and matches date structures dynamically (`DD-MM-YYYY` or `YYYY-MM-DD`).

### B. Machine Learning Engine (Isolation Forest)
For detecting multi-dimensional outliers, we utilize the **Isolation Forest** algorithm (`sklearn.ensemble.IsolationForest`).

#### 💡 Why Isolation Forest?
Traditional anomaly detection algorithms (like One-Class SVM or Elliptic Envelope) try to define the region of normal data and flag anything outside it. This is computationally expensive and struggles in high dimensions. 
* **Concept:** Isolation Forest works on the principle that **anomalies are few and different**. 
* **Mechanism:** It builds an ensemble of isolation trees (randomly partitioning features). Because anomalies have unusual attribute values, they require **fewer splits** to isolate. Thus, anomalous records reside closer to the **root** of the isolation trees, resulting in a shorter average path length.
* **Contamination Rate:** Tuned to $5\%$ to accommodate normal statistical variations without raising false warning rates.

#### ⚙️ Feature Pipeline
The FastAPI service runs data through a scikit-learn `Pipeline` utilizing `ColumnTransformer`:
1. **Numerical Data:** Handled via a `SimpleImputer` (median strategy) and standardized with `StandardScaler` to remove mean-and-variance scaling biases.
2. **Categorical Data:** Encoded using `OneHotEncoder` (handling unknown values gracefully) to convert textual data into binary features.

#### 📝 Statistical Explainability (Z-Score)
To make the AI decisions explainable to human reviewers:
* For any record flagged as anomalous, the system calculates the **Z-Score** of its numeric attributes relative to historical averages:
  $$Z = \frac{|x - \mu|}{\sigma}$$
* If any feature deviates by more than $2.0$ standard deviations ($Z > 2.0$), the ML engine automatically appends an explanation (e.g., *"Monthly Income (900,000) is significantly higher than the historical average"*).

---

## 🌟 Key Functionalities & Modules

### 1. Admin Dashboard
* **Dynamic Statistics:** Overall system data quality metrics (Total records processed, overall accuracy, active flagged counts).
* **ML Model Training Hub:** Admins can trigger **on-demand retraining** of the Isolation Forest model on validated database records, automatically updating model weights to fit new survey cycles.
* **Interactive Reviews:** Admins can approve or request re-verification for flagged survey records.

### 2. Enumerator Workspace
* **Village Constraints:** Restricts enumerators to a **strict 1-to-1 relationship** with their assigned village, preventing data-entry overlaps.
* **Interactive CSV Processing:** Displays real-time upload progress, summary stats, and flagged reasons on their personal dashboard.
* **Secure Profile View:** Modal-based, password-restricted viewer fetching populate-rich assigned village details and account credentials.
* **Dataset Management:** Actions to review, analyze, or delete datasets (which triggers a cascade-delete of the file and all associated survey rows).

### 3. Survey Data Explorer & Reports
* **Enumerator-Wise Explorer:** Admin view displaying uploaded CSV datasets grouped by enumerator, showing file metadata, processing status, and validation quality ratios.
* **Reports Dashboard:** Tabular lists of **Villages** and **Enumerators** filtered to show *only those who have uploaded data*.
* **One-Click Exports:** Includes options to download detailed CSV summaries or export the entire list of raw survey records with computed anomaly indicators.

### 4. Historical Demographics & Statistics
* **Yearly Trends Charts:** Interactive trend visualization of core survey attributes including average monthly income, weekly hours worked, household size, and distribution levels for education and employment over time.
* **Interactive District Filters:** Dropdown selector allowing users to filter statistics dynamically by specific districts or view consolidated aggregates for the entire state.
* **Yearly Summary Cards:** Interactive comparison cards displaying summary aggregates per survey year.

---



## 💻 Tech Stack & Technology Mapping

The table below describes the role of each technology used in the SurveyShield ecosystem:

| Layer | Technology / Library | Specific Purpose in Application |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | Single Page Application (SPA) architecture, interactive forms, and profile modals. |
| **Frontend** | **TailwindCSS** | Clean modern look, glassmorphism, responsive navigation, and user dashboards. |
| **Frontend** | **Lucide Icons** | Contextual icons (Trash, FileText, CheckCircle, Warning, User) for action rows. |
| **Frontend** | **Recharts** | Interactive pie, bar, line, and stacked charts displaying anomalies, validation ratios, and historical demographic trends. |
| **Backend** | **Node.js & Express.js** | Core server host, REST API router, authentication middleware, and business logic. |
| **Backend** | **Multer** | Handles file uploads, streaming the uploaded CSV files onto the filesystem. |
| **Backend** | **CSV-Parser** | Fast stream parsing of CSV records into standard JavaScript objects for auditing. |
| **Database** | **MongoDB & Mongoose** | NoSQL document storage storing structured User, Village, Dataset, and SurveyRecord collections. |
| **ML Service** | **FastAPI** | High-performance Python microservice exposing prediction and training endpoints. |
| **ML Service** | **Uvicorn** | Fast ASGI web server hosting the FastAPI endpoints. |
| **ML Model** | **Scikit-learn (Sklearn)** | Evaluates the datasets using the `IsolationForest` model and feature scalers. |
| **ML Model** | **Pandas & NumPy** | Handles DataFrame conversions, scaling transformations, and matrix operations. |
| **ML Serialization** | **Joblib** | Saves and loads model objects (`.joblib`) from disk during training and inference. |

---

## 🔄 End-to-End Process Flow Summary

```
[Enumerator Login]
       │
       ▼
[Upload Survey CSV] ──► [Node.js Streams CSV] ──► [Evaluate Logical Rules (Rule Risk Score)]
                               │
                               ▼ (Batch HTTP POST)
                        [FastAPI ML Service]
                               │
                               ▼
                        [Column Scaling & Encoding Pipeline]
                               │
                               ▼
                        [Isolation Forest Inference]
                               │
                               ▼ (Returns Anomaly Scores & Z-Score Explanations)
                        [Consolidated Combined Risk Score (70% ML, 30% Rules)]
                               │
                               ▼
                        [Save Records to MongoDB]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Enumerator Workspace Update]            [Admin Reports & Retraining Hub]
 - View Flagged Reasons                   - Retrain Model on Clean Data
 - Dynamic CSV Deletions                  - Group & Search Enumerator Uploads
                                          - Download Location & Agent Audits
```

1. **Upload & Pre-Validation:** The enumerator uploads a CSV sheet. Node.js processes it, running deterministic check boundaries (e.g. verifying dates and logical integrity) to calculate a **Rule Risk Score**.
2. **AI Analysis:** The backend transfers the records to the FastAPI service. The service pre-processes the inputs using a pipeline transformation (standardizing numeric attributes and encoding categories) and analyzes them using `IsolationForest` to yield decision scores. Outliers are scrutinized via **Z-Scores** to construct plain-English anomaly reasons.
3. **Consolidation & Storage:** Node.js calculates a **Combined Risk Score** (70% ML, 30% Rules). Rows with risks $\ge 60$ are marked as **Flagged** with warning/critical statuses, and safe rows are marked **Validated**. All records are saved to MongoDB.
4. **Actionable Insights:** Enumerators can review flagged reasons on their dashboard or delete erroneous datasets. Admins can group datasets enumerator-wise, extract CSV audit logs for specific villages/enumerators, and initiate model retraining using verified data.
