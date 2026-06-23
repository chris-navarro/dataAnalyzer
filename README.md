# SREVis - Data Analyzer 

A powerful, modern web application for analyzing Excel and CSV files with interactive visualizations and comprehensive statistical analysis.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/srevis)
[![Python](https://img.shields.io/badge/python-3.8+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-2.3.3-blue.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Chart Types](#chart-types)
- [File Management](#file-management)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## 🚀 Overview

SREVis is a comprehensive data analysis tool that allows users to upload Excel and CSV files, explore their data through interactive visualizations, and gain insights through statistical analysis. The application features a modern, responsive interface with dark/light theme support and a user-friendly layout.

### Key Highlights

- 📊 **15+ Interactive Chart Types** - From simple bar charts to complex treemaps
- 📁 **Multi-format Support** - Excel (.xlsx, .xls, .xlsm, .xlsb, .ods) and CSV
- 🔄 **CRUD Operations** - Full file management capabilities
- 📈 **Statistical Analysis** - Comprehensive column statistics
- 🎨 **Dark/Light Theme** - Toggle between themes with persistent preference
- 📱 **Responsive Design** - Works on desktop and mobile devices

## ✨ Features

### 📊 Data Analysis
- **Multiple Chart Types**: 15+ visualization options including bar, line, scatter, pie, and more
- **Customizable Axes**: Select X and Y columns from your data
- **Dual Display Modes**: View results as interactive graphs or tables
- **Statistical Analysis**: Comprehensive statistics for selected columns including mean, median, skewness, and kurtosis

### 📁 File Management
- **Multi-format Support**: Excel (.xlsx, .xls, .xlsm, .xlsb, .ods) and CSV files
- **CRUD Operations**: Upload, view, download, and delete files
- **File Information**: Detailed metadata including size, row count, and data types
- **Data Preview**: Quick preview of file contents without loading

### 🎨 User Experience
- **Two-Column Layout**: Upload and file management on left, analysis on right
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Centered Modals**: Detailed information displayed in clean, centered modals
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Visual Feedback**: Status messages, loading indicators, and hover effects

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Flask | 2.3.3 | Web framework |
| Pandas | 2.1.4 | Data manipulation and analysis |
| Plotly | 5.18.0 | Interactive visualizations |
| OpenPyXL | 3.1.2 | Excel file processing |
| NumPy | 1.26.3 | Numerical computing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Bootstrap | 5.3.0 | UI framework |
| jQuery | 3.7.0 | DOM manipulation |
| Plotly.js | 2.27.0 | Chart rendering |
| Font Awesome | 6.4.0 | Icons |

## 📁 Directory Structure

```text
data_analyzer/
├── app.py                          # Application entry point
├── requirements.txt                # Python dependencies
├── flask_backend/                  # Main application package
│   ├── __init__.py                 # Package initialization
│   ├── routes.py                   # Route definitions and controllers
│   ├── excel.py                    # Data processing and chart generation
│   ├── uploads/                    # Uploaded file storage
│   ├── templates/                  # HTML templates
│   │   ├── base.html               # Base template with common elements
│   │   └── index.html              # Main application page
│   └── static/                     # Static assets
│       ├── css/
│       │   └── style.css           # Custom styles and themes
│       └── js/
│           └── main.js             # Client-side application logic
```

## 🔧 Installation
Prerequisites
Python 3.8 or higher

pip (Python package manager)

Git (optional)

Step-by-Step Installation
Clone the repository

```bash
git clone https://github.com/yourusername/srevis.git
cd srevis
Create and activate a virtual environment
```
## Windows:

```bash
python -m venv venv
venv\Scripts\activate
```
## macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install dependencies

``` bash
pip install -r requirements.txt
Run the application
```
```bash
python app.py
Access the application
Open your browser and navigate to: http://localhost:5000
```

## 📖 Usage Guide
Uploading Files
Click the "Upload" button in the left panel

Select your Excel (.xlsx, .xls, .xlsm, .xlsb, .ods) or CSV file

Click "Upload & Analyze" to load the file

Analyzing Data
Select Columns:

Choose X-Axis columns (for categories/timeline)

Choose Y-Axis columns (for values to analyze)

Choose Chart Type:

Comparison & Ranking: Bar, Column, Spider/Radar

Trends & Time Series: Line, Area, Candlestick

Distribution & Spread: Histogram, Box, Violin

Correlation & Relationships: Scatter, Bubble, Heatmap

Part-to-Whole: Pie, Donut, Treemap, Sunburst

Select Display Type:

Graph: Interactive Plotly visualization

Table: Tabular data view

Generate: Click the "Generate" button to create your visualization

Managing Files
Load: Click the folder icon to load a file for analysis

Preview: Click the eye icon to view data without loading

Download: Click the download icon to save the file

Delete: Click the trash icon to remove a file

View Info: Click the filename to see detailed file information

## Statistics
Click the "Statistics" button to view comprehensive statistics for selected columns including:

Mean, Median, Standard Deviation

Minimum, Maximum

Count, Unique values

Skewness, Kurtosis

## 📊 Chart Types
Comparison & Ranking
Bar Chart: Compare values across categories

Column Chart: Vertical bar representation

Spider/Radar Chart: Compare multiple variables

## Trends & Time Series
Line Chart: Show trends over time

Area Chart: Emphasize cumulative totals

## Candlestick Chart: Financial data visualization

## Distribution & Spread
Histogram: Frequency distribution

Box Plot: Show quartiles and outliers

Violin Plot: Distribution comparison

## Correlation & Relationships
Scatter Plot: Show relationships between variables

Bubble Chart: Multi-dimensional data visualization

## Heatmap: Correlation matrix

Part-to-Whole
Pie Chart: Show proportions

Donut Chart: Enhanced pie chart

Treemap: Hierarchical data display

Sunburst Chart: Multi-level hierarchical data

## 🔌 API Endpoints
File Operations
Endpoint	Method	Description
/upload	POST	Upload a new file
/files	GET	List all uploaded files
/files/<filename>	GET	Get file details
/files/<filename>	DELETE	Delete a file
/files/<filename>/download	GET	Download a file
/files/clear_all	DELETE	Delete all files
Analysis Operations
Endpoint	Method	Description
/analyze	POST	Generate analysis (graph or table)
/get_stats	POST	Get column statistics
/get_file_info	GET	Get current file information
🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request


## 👨‍💻 Author
Chris Navarro

GitHub: @chrissanchez

LinkedIn: Chris Navarro
