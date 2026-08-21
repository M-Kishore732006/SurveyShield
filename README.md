
# SurveyShield

SurveyShield is a survey data validation and quality assurance platform developed to identify errors, inconsistencies, and unusual patterns in field-collected survey datasets.

The system combines rule-based validation, statistical analysis, and machine learning to help supervisors review large volumes of survey data more efficiently.

## Overview

Survey datasets collected from multiple enumerators can contain missing values, invalid entries, contradictory responses, duplicates, and unusual patterns. Traditional validation methods mainly depend on predefined rules and may not identify more complex patterns in the data.

SurveyShield addresses this by using multiple levels of validation:

- Data quality checks
- Rule-based validation
- Machine learning-based anomaly detection
- Statistical explanations
- Enumerator and village-level analysis
- Aggregate and temporal analysis
- Report generation

The system is designed to support survey data validation workflows where human review is still required for final decisions.

## Main Features

### 1. CSV Data Upload

Enumerators can upload survey datasets in CSV format.

The system processes the uploaded data and stores the survey records for further validation and analysis.

### 2. Data Quality Analysis

Before running machine learning, the uploaded dataset is checked for basic quality issues.

The system identifies:

- Missing values
- Duplicate records
- Invalid values
- Missing required fields
- Incorrect data types
- Out-of-range values

A data quality summary is generated for every uploaded dataset.

### 3. Rule-Based Validation

The rule engine checks predefined logical and range-based conditions.

Examples:

- Age must be within a valid range.
- Working hours must be within a valid range.
- Required fields should not be empty.
- Related fields should have logically consistent values.

The validation result is classified as:

- PASS
- WARNING
- REVIEW_REQUIRED
- REJECTED

### 4. Machine Learning Anomaly Detection

SurveyShield uses Isolation Forest for detecting unusual patterns in survey data.

Historical survey data is used to learn normal patterns. New survey records are then compared against these learned patterns.

The model produces an anomaly score which is converted into a 0–100 risk score.

Risk levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

An anomaly does not automatically mean that the record is incorrect or fraudulent. It indicates that the record requires further review.

### 5. Explainable Anomaly Detection

The system provides statistical explanations for flagged records.

For numerical features, values can be compared with historical distributions using measures such as mean, standard deviation, and Z-score.

Example:

```text
Working Hours
Observed Value: 90
Historical Average: 42
Z-Score: +3.2
````

The system can then explain that the working hours are significantly higher than the historical average.

### 6. Multi-Level Anomaly Detection

SurveyShield analyzes data at three levels.

#### Record Level

Identifies unusual individual survey records.

#### Cluster Level

Analyzes groups such as:

* Enumerators
* Villages

It can compare anomaly rates, distributions, and average anomaly scores between groups.

#### Aggregate Level

Analyzes larger patterns across:

* Villages
* Districts
* States
* Months
* Years

This helps identify temporal changes, regional deviations, and unusual aggregate patterns.

### 7. Cross-Survey Analysis

The platform can compare current survey results with historical and related survey datasets.

For example:

```text
Current Survey:       84%
Historical Average:   62%
Related Survey:       65%
```

A large deviation can be flagged as a potential cross-survey inconsistency for supervisor review.

### 8. ML Model Evaluation

The system provides a controlled environment to evaluate anomaly detection models.

Historical data can be used as a baseline and controlled anomalies can be introduced for evaluation.

Depending on the available labels, the system can calculate:

* Precision
* Recall
* F1 Score
* False Positive Rate
* Detection Rate

This allows different model versions to be evaluated before deployment.

### 9. Model Versioning

Every trained machine learning model is assigned a version.

Example:

```text
IF-v1
IF-v2
IF-v3
```

Each anomaly result is associated with the model version that generated it.

This makes it easier to track model changes and compare results between different training cycles.

### 10. Reports

The platform provides reports for:

* Individual enumerators
* Villages
* Uploaded datasets
* Anomalous records

Reports contain information such as:

* Total records
* Valid records
* Data quality statistics
* Anomaly count
* Anomaly score
* Risk level
* Anomaly reason
* Enumerator
* Village
* Model version

Reports can be viewed and downloaded in PDF and CSV formats.

## System Workflow

```text
Enumerator Uploads CSV
        |
        v
Data Quality Analysis
        |
        v
Rule-Based Validation
        |
        v
Machine Learning Analysis
        |
        v
Anomaly Score
        |
        v
Statistical Explanation
        |
        v
Store Results
        |
        +-------------------+
        |                   |
        v                   v
Record Analysis       Cluster Analysis
                            |
                            v
                    Aggregate Analysis
                            |
                            v
                    Supervisor Review
                            |
                            v
                         Reports
```

## Technology Stack

### Frontend

* React.js
* Tailwind CSS
* Recharts
* Lucide Icons

### Backend

* Node.js
* Express.js
* Multer
* CSV Parser

### Database

* MongoDB
* Mongoose

### Machine Learning

* Python
* FastAPI
* Uvicorn
* Scikit-learn
* Pandas
* NumPy
* Joblib

## Architecture

The application is divided into a main web application and a separate machine learning service.

```text
React Frontend
      |
      v
Node.js / Express
      |
      +------------------+
      |                  |
      v                  v
   MongoDB          FastAPI ML Service
                         |
                         v
                   Python ML Pipeline
                         |
              +----------+----------+
              |                     |
              v                     v
       Isolation Forest       Statistical Analysis
              |                     |
              +----------+----------+
                         |
                         v
                  Anomaly Results
```

The separation of the ML service allows the machine learning pipeline to be developed and updated independently from the main web application.

## Machine Learning Pipeline

The ML pipeline follows these steps:

```text
Historical Survey Data
        |
        v
Data Cleaning
        |
        v
Missing Value Handling
        |
        v
Data Type Conversion
        |
        v
Categorical Encoding
        |
        v
Feature Selection
        |
        v
Isolation Forest
        |
        v
Anomaly Detection
        |
        v
Risk Score
        |
        v
Statistical Explanation
```

Categorical variables are encoded based on their type. One-hot encoding is used for nominal categories, while ordinal encoding can be used for fields with a meaningful order.

Identifiers such as household IDs and upload IDs are not used as machine learning features.

## Project Structure

```text
SurveyShield/
|
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
|
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── services/
|
├── ml-service/
│   ├── preprocessing/
│   ├── models/
│   ├── evaluation/
│   └── main.py
|
├── uploads/
|
└── README.md
```

The exact structure may vary depending on the implementation.

## User Roles

### Enumerator

Enumerators can:

* Upload survey CSV files
* View uploaded datasets
* Review validation results
* View anomaly details
* View their survey history
* Download their reports

### Administrator

Administrators can:

* View overall survey statistics
* Review enumerator and village performance
* Analyze record, cluster, and aggregate anomalies
* View cross-survey analysis
* Evaluate ML models
* Retrain models
* Manage model versions
* Generate reports

## Example Anomaly Result

```text
Record ID: H00123

Validation Status:
REVIEW_REQUIRED

ML Risk:
HIGH

Anomaly Score:
87/100

Reason:
Working hours are significantly higher than the
historical average.

Model Version:
IF-v3
```

The system treats this as a potential anomaly that requires human review rather than automatically classifying it as fraud.

## Future Improvements

Possible future improvements include:

* Supervisor feedback-based model improvement
* Additional anomaly detection algorithms
* More advanced explainable AI techniques
* Automated model comparison
* Integration with external survey platforms
* Integration with the eSigma ecosystem
* Support for additional government surveys

## Purpose

SurveyShield is intended to assist survey data supervisors by reducing manual validation effort and providing additional statistical and machine learning-based insights.

The final decision about whether a survey record is correct remains with the authorized human reviewer.

```
```
