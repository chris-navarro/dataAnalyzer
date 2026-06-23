# SREVis - Data Analyzer 

A powerful, modern web application for analyzing Excel and CSV files with interactive visualizations and comprehensive statistical analysis.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/srevis)
[![Python](https://img.shields.io/badge/python-3.8+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-2.3.3-blue.svg)](https://flask.palletsprojects.com/)

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

### 📤 Uploading Files

1. Click the **"Upload"** button in the left panel
2. Select your file (Excel or CSV format)
3. Click **"Upload & Analyze"** to load the file

**Supported Formats:**
- Excel: `.xlsx`, `.xls`, `.xlsm`, `.xlsb`, `.ods`
- CSV: `.csv`

---

### 📊 Analyzing Data

#### Step 1: Select Columns
| Selection | Description |
|-----------|-------------|
| **X-Axis** | Choose columns for categories, labels, or timeline |
| **Y-Axis** | Choose columns for values to analyze |

*💡 Tip: Hold Ctrl/Cmd for multiple column selection*

#### Step 2: Choose Chart Type

| Category | Chart Types | Best For |
|----------|-------------|----------|
| **Comparison & Ranking** | Bar, Column, Spider/Radar | Comparing values across categories |
| **Trends & Time Series** | Line, Area, Candlestick | Showing patterns over time |
| **Distribution & Spread** | Histogram, Box, Violin | Understanding data distribution |
| **Correlation & Relationships** | Scatter, Bubble, Heatmap | Finding relationships between variables |
| **Part-to-Whole** | Pie, Donut, Treemap, Sunburst | Showing proportions and composition |

#### Step 3: Select Display Type

| Display Type | Description |
|--------------|-------------|
| **Graph** | Interactive Plotly visualization with zoom, hover, and export features |
| **Table** | Tabular data view for precise value inspection |

#### Step 4: Generate
Click the **"Generate"** button to create your visualization

---

### 📁 Managing Files

The file management panel provides complete control over your uploaded data:

| Action | Icon | Description |
|--------|------|-------------|
| **Load** | 📂 | Load a file for analysis (replaces current data) |
| **Preview** | 👁️ | View data preview without loading |
| **Download** | ⬇️ | Download the file to your computer |
| **Delete** | 🗑️ | Remove the file from the system |
| **View Info** | 📋 | See detailed file information (click filename) |
| **Refresh** | 🔄 | Refresh the file list |
| **Clear All** | 🗑️ | Delete all uploaded files |

---

### 📈 Statistics

Click the **"Statistics"** button to view comprehensive statistics for selected columns:

#### Numeric Columns
| Statistic | Description |
|-----------|-------------|
| **Mean** | Average value |
| **Median** | Middle value (50th percentile) |
| **Standard Deviation** | Measure of data spread |
| **Minimum** | Smallest value |
| **Maximum** | Largest value |
| **Count** | Number of non-null values |
| **Unique** | Number of distinct values |
| **Skewness** | Measure of distribution asymmetry |
| **Kurtosis** | Measure of distribution tail heaviness |

#### Categorical Columns
| Statistic | Description |
|-----------|-------------|
| **Count** | Number of non-null values |
| **Unique Values** | Number of distinct categories |
| **Sample Values** | Example of unique values |

---

## 📊 Chart Types

### 📊 Comparison & Ranking
| Chart Type | Description | Best Use Case |
|------------|-------------|---------------|
| **Bar Chart** | Rectangular bars for comparing values across categories | Sales by product, population by country |
| **Column Chart** | Vertical bars for category comparison | Monthly revenue, survey results |
| **Spider/Radar Chart** | Multi-variable comparison on a central point | Performance metrics, skill assessment |

### 📈 Trends & Time Series
| Chart Type | Description | Best Use Case |
|------------|-------------|---------------|
| **Line Chart** | Data points connected by lines showing trends | Stock prices, temperature changes |
| **Area Chart** | Line chart with filled area below | Cumulative totals, stacked data |
| **Candlestick Chart** | Financial data showing open, high, low, close | Stock market analysis, trading |

### 📊 Distribution & Spread
| Chart Type | Description | Best Use Case |
|------------|-------------|---------------|
| **Histogram** | Groups data into bins showing frequency | Age distribution, test scores |
| **Box Plot** | Shows quartiles, median, and outliers | Comparing distributions, identifying outliers |
| **Violin Plot** | Combines box plot with density estimation | Detailed distribution comparison |

### 🔗 Correlation & Relationships
| Chart Type | Description | Best Use Case |
|------------|-------------|---------------|
| **Scatter Plot** | Points on Cartesian plane showing relationships | Correlation between two variables |
| **Bubble Chart** | Scatter plot with size/color representing additional variables | Multi-dimensional data relationships |
| **Heatmap** | Color-coded matrix showing correlations | Correlation matrix, data density |

### 🎯 Part-to-Whole
| Chart Type | Description | Best Use Case |
|------------|-------------|---------------|
| **Pie Chart** | Circle divided into proportional slices | Market share, budget allocation |
| **Donut Chart** | Pie chart with center hole | Enhanced pie chart with focus on proportions |
| **Treemap** | Nested rectangles showing hierarchical data | File system usage, organizational structure |
| **Sunburst Chart** | Multi-level donut chart | Hierarchical data with multiple levels |

---

## 🔌 API Endpoints

### File Operations

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/upload` | POST | Upload a new file | Multipart form data |
| `/files` | GET | List all uploaded files | - |
| `/files/<filename>` | GET | Get file details | - |
| `/files/<filename>` | DELETE | Delete a file | - |
| `/files/<filename>/download` | GET | Download a file | - |
| `/files/clear_all` | DELETE | Delete all files | - |

### Analysis Operations

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/analyze` | POST | Generate analysis (graph or table) | JSON with x_columns, y_columns, chart_type, display_type |
| `/get_stats` | POST | Get column statistics | JSON with columns array |
| `/get_file_info` | GET | Get current file information | - |

### Example API Usage

**Generate a chart:**
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "x_columns": ["Date"],
    "y_columns": ["Sales", "Revenue"],
    "chart_type": "bar",
    "display_type": "graph"
  }'
```
## 🤝 Contributing

We welcome contributions from the community! Here's how you can help improve SREVis:

👨‍💻 Author
Chris Navarro

Data Analyst & Software Developer passionate about building intuitive data visualization tools.

## 🙏 Acknowledgments
- Built with ❤️ using Flask and Plotly
- UI powered by Bootstrap
- Icons by Font Awesome
- Special thanks to all contributors