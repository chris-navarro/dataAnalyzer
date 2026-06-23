import pandas as pd
import plotly
import plotly.graph_objects as go
import plotly.express as px
import json
import numpy as np
import os
import shutil
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class ExcelAnalyzer:
    def __init__(self):
        self.df = None
        self.filename = None
        self.file_extension = None
        self.current_file_path = None
    
    def load_file(self, filepath):
        """Load Excel or CSV file and store as dataframe"""
        try:
            # Get file extension
            self.file_extension = os.path.splitext(filepath)[1].lower()
            self.filename = os.path.basename(filepath)
            self.current_file_path = filepath
            
            # Load based on file type
            if self.file_extension in ['.xlsx', '.xls']:
                self.df = pd.read_excel(filepath, engine='openpyxl')
            elif self.file_extension == '.xlsm':
                self.df = pd.read_excel(filepath, engine='openpyxl', keep_vba=True)
            elif self.file_extension == '.xlsb':
                self.df = pd.read_excel(filepath, engine='pyxlsb')
            elif self.file_extension == '.ods':
                self.df = pd.read_excel(filepath, engine='odf')
            elif self.file_extension == '.csv':
                self.df = self._load_csv_with_auto_detect(filepath)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported file format: {self.file_extension}'
                }
            
            # Clean the data - replace NaN with None for JSON serialization
            self.df = self.df.replace({np.nan: None})
            
            columns = self.df.columns.tolist()
            
            # Convert sample data to JSON-safe format
            sample_data = []
            for _, row in self.df.head(10).iterrows():
                row_dict = {}
                for col in columns:
                    value = row[col]
                    if pd.isna(value):
                        row_dict[col] = None
                    elif isinstance(value, (np.integer, np.floating)):
                        row_dict[col] = float(value) if not pd.isna(value) else None
                    elif isinstance(value, (np.bool_)):
                        row_dict[col] = bool(value)
                    else:
                        row_dict[col] = value
                sample_data.append(row_dict)
            
            return {
                'success': True,
                'columns': columns,
                'sample_data': sample_data,
                'shape': f'{self.df.shape[0]} rows × {self.df.shape[1]} columns',
                'file_type': self.file_extension,
                'filename': self.filename
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _load_csv_with_auto_detect(self, filepath):
        """Load CSV with automatic encoding and delimiter detection"""
        encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252', 'utf-16', 'utf-32']
        delimiters = [',', ';', '\t', '|', ':']
        
        for encoding in encodings:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    first_line = f.readline()
                    for delimiter in delimiters:
                        if delimiter in first_line:
                            try:
                                df = pd.read_csv(filepath, encoding=encoding, delimiter=delimiter)
                                if len(df.columns) > 1:
                                    return df
                            except:
                                continue
                return pd.read_csv(filepath, encoding=encoding)
            except UnicodeDecodeError:
                continue
            except Exception:
                continue
        
        try:
            return pd.read_csv(filepath, encoding='utf-8', delimiter=',')
        except:
            raise Exception("Unable to read CSV file. Please check file format and encoding.")
    
    def create_chart(self, x_columns, y_columns, chart_type):
        """Create various chart types based on user selection"""
        if self.df is None:
            return None
        
        # Clean data for plotting - remove rows with NaN in selected columns
        plot_df = self.df.copy()
        for col in x_columns + y_columns:
            if col in plot_df.columns:
                plot_df = plot_df[plot_df[col].notna()]
        
        if plot_df.empty:
            return None
        
        # Ensure we have data
        if len(plot_df) == 0:
            return None
        
        # Chart type mapping
        chart_functions = {
            'bar': self._create_bar_chart,
            'column': self._create_bar_chart,
            'spider': self._create_spider_chart,
            'radar': self._create_spider_chart,
            'line': self._create_line_chart,
            'area': self._create_area_chart,
            'candlestick': self._create_candlestick_chart,
            'histogram': self._create_histogram,
            'box': self._create_box_plot,
            'scatter': self._create_scatter_plot,
            'bubble': self._create_bubble_chart,
            'pie': self._create_pie_chart,
            'donut': self._create_donut_chart,
            'treemap': self._create_treemap,
            'heatmap': self._create_heatmap,
            'violin': self._create_violin_plot,
            'sunburst': self._create_sunburst_chart
        }
        
        chart_func = chart_functions.get(chart_type, self._create_bar_chart)
        return chart_func(x_columns, y_columns, plot_df)
    
    def _create_bar_chart(self, x_columns, y_columns, df):
        """Create bar/column chart"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Bar(
                x=df[x_columns[0]],
                y=df[col],
                name=col,
                marker_color='rgb(55, 83, 109)'
            ))
        
        # Get Y-axis label - use first y column if multiple, otherwise show all
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Bar Chart: {", ".join(y_columns)} vs {x_columns[0]}',
            xaxis_title=x_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            barmode='group',
            height=500
        )
        return fig
    
    def _create_spider_chart(self, x_columns, y_columns, df):
        """Create spider/radar chart"""
        fig = go.Figure()
        
        sample_df = df.head(10)
        
        for idx, row in sample_df.iterrows():
            fig.add_trace(go.Scatterpolar(
                r=[row[col] for col in y_columns],
                theta=y_columns,
                fill='toself',
                name=f'Row {idx + 1}'
            ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, sample_df[y_columns].max().max()]
                )
            ),
            title='Radar Chart Comparison',
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_line_chart(self, x_columns, y_columns, df):
        """Create line chart"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Scatter(
                x=df[x_columns[0]],
                y=df[col],
                name=col,
                mode='lines+markers'
            ))
        
        # Get Y-axis label
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Line Chart: {", ".join(y_columns)} over {x_columns[0]}',
            xaxis_title=x_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            hovermode='x unified',
            height=500
        )
        return fig
    
    def _create_area_chart(self, x_columns, y_columns, df):
        """Create area chart"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Scatter(
                x=df[x_columns[0]],
                y=df[col],
                name=col,
                fill='tonexty',
                mode='lines'
            ))
        
        # Get Y-axis label
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Area Chart: {", ".join(y_columns)} over {x_columns[0]}',
            xaxis_title=x_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_candlestick_chart(self, x_columns, y_columns, df):
        """Create candlestick chart for financial data"""
        required_cols = ['open', 'high', 'low', 'close']
        col_map = {}
        for req in required_cols:
            for col in df.columns:
                if req in col.lower():
                    col_map[req] = col
                    break
        
        if len(col_map) < 4:
            fig = go.Figure()
            for col in y_columns:
                fig.add_trace(go.Scatter(
                    x=df[x_columns[0]],
                    y=df[col],
                    name=col,
                    mode='lines'
                ))
            fig.update_layout(
                title='Candlestick-like Chart (Synthetic Data)',
                template='plotly_white',
                height=500
            )
            return fig
        
        fig = go.Figure(data=[go.Candlestick(
            x=df[x_columns[0]],
            open=df[col_map['open']],
            high=df[col_map['high']],
            low=df[col_map['low']],
            close=df[col_map['close']],
            name='OHLC'
        )])
        
        fig.update_layout(
            title='Candlestick Chart',
            yaxis_title='Price',
            template='plotly_white',
            xaxis_rangeslider_visible=False,
            height=500
        )
        return fig
    
    def _create_histogram(self, x_columns, y_columns, df):
        """Create histogram"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Histogram(
                x=df[col],
                name=col,
                nbinsx=30,
                opacity=0.7
            ))
        
        # Get Y-axis label
        y_label = 'Frequency'
        
        fig.update_layout(
            title=f'Histogram: Distribution of {", ".join(y_columns)}',
            xaxis_title=', '.join(y_columns) if len(y_columns) > 1 else y_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            barmode='overlay',
            height=500
        )
        return fig
    
    def _create_box_plot(self, x_columns, y_columns, df):
        """Create box plot"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Box(
                y=df[col],
                name=col,
                boxmean='sd'
            ))
        
        # Get Y-axis label
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Box Plot: Distribution of {", ".join(y_columns)}',
            yaxis_title=y_label,
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_scatter_plot(self, x_columns, y_columns, df):
        """Create scatter plot"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Scatter(
                x=df[x_columns[0]],
                y=df[col],
                mode='markers',
                name=col,
                marker=dict(
                    size=8,
                    opacity=0.7
                )
            ))
        
        # Get Y-axis label
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Scatter Plot: {", ".join(y_columns)} vs {x_columns[0]}',
            xaxis_title=x_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            hovermode='closest',
            height=500
        )
        return fig
    
    def _create_bubble_chart(self, x_columns, y_columns, df):
        """Create bubble chart"""
        fig = go.Figure()
        
        size_col = y_columns[0] if y_columns else None
        
        if len(y_columns) > 1:
            color_col = y_columns[1]
            
            fig.add_trace(go.Scatter(
                x=df[x_columns[0]],
                y=df[y_columns[0]],
                mode='markers',
                marker=dict(
                    size=df[size_col] if size_col else 10,
                    color=df[color_col],
                    colorscale='Viridis',
                    showscale=True,
                    opacity=0.7
                ),
                text=df[x_columns[0]],
                name='Bubble Chart'
            ))
        else:
            fig.add_trace(go.Scatter(
                x=df[x_columns[0]],
                y=df[y_columns[0]],
                mode='markers',
                marker=dict(
                    size=df[size_col] if size_col else 10,
                    opacity=0.7
                ),
                name='Bubble Chart'
            ))
        
        # Get Y-axis label
        y_label = y_columns[0] if y_columns else 'Values'
        
        fig.update_layout(
            title=f'Bubble Chart: {", ".join(y_columns)} vs {x_columns[0]}',
            xaxis_title=x_columns[0],
            yaxis_title=y_label,
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_pie_chart(self, x_columns, y_columns, df):
        """Create pie chart"""
        if len(df) > 10:
            pie_df = df.groupby(x_columns[0])[y_columns[0]].sum().reset_index()
        else:
            pie_df = df
        
        fig = go.Figure(data=[go.Pie(
            labels=pie_df[x_columns[0]],
            values=pie_df[y_columns[0]],
            hole=0.3,
            textinfo='label+percent'
        )])
        
        fig.update_layout(
            title=f'Pie Chart: {y_columns[0]} by {x_columns[0]}',
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_donut_chart(self, x_columns, y_columns, df):
        """Create donut chart"""
        if len(df) > 10:
            pie_df = df.groupby(x_columns[0])[y_columns[0]].sum().reset_index()
        else:
            pie_df = df
        
        fig = go.Figure(data=[go.Pie(
            labels=pie_df[x_columns[0]],
            values=pie_df[y_columns[0]],
            hole=0.5,
            textinfo='label+percent'
        )])
        
        fig.update_layout(
            title=f'Donut Chart: {y_columns[0]} by {x_columns[0]}',
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_treemap(self, x_columns, y_columns, df):
        """Create treemap"""
        if len(x_columns) > 1:
            hierarchy = x_columns
        else:
            hierarchy = [x_columns[0], 'index']
            df_copy = df.copy()
            df_copy['index'] = df_copy.index
            df = df_copy
        
        fig = go.Figure(go.Treemap(
            labels=df[hierarchy[0]] if len(hierarchy) == 1 else df[hierarchy],
            parents=df[hierarchy[0]] if len(hierarchy) > 1 else [None] * len(df),
            values=df[y_columns[0]],
            textinfo='label+value+percent entry',
            branchvalues='total'
        ))
        
        fig.update_layout(
            title=f'Treemap: {y_columns[0]} Distribution',
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_heatmap(self, x_columns, y_columns, df):
        """Create heatmap for correlation or data matrix"""
        all_cols = x_columns + y_columns
        if len(all_cols) > 1:
            numeric_cols = [col for col in all_cols if pd.api.types.is_numeric_dtype(df[col])]
            if len(numeric_cols) > 1:
                corr_matrix = df[numeric_cols].corr()
                fig = go.Figure(data=go.Heatmap(
                    z=corr_matrix.values,
                    x=corr_matrix.columns,
                    y=corr_matrix.index,
                    colorscale='RdBu',
                    zmin=-1,
                    zmax=1
                ))
                fig.update_layout(
                    title='Correlation Heatmap',
                    template='plotly_white',
                    height=500
                )
                return fig
        
        fig = go.Figure(data=go.Heatmap(
            z=df[y_columns[0]].values.reshape(-1, 1),
            y=df[x_columns[0]].values,
            colorscale='Viridis'
        ))
        
        # Get Y-axis label
        y_label = y_columns[0] if y_columns else 'Values'
        
        fig.update_layout(
            title=f'Heatmap: {y_label} by {x_columns[0]}',
            xaxis_title=y_label,
            yaxis_title=x_columns[0],
            template='plotly_white',
            height=500
        )
        return fig
    
    def _create_violin_plot(self, x_columns, y_columns, df):
        """Create violin plot for distribution comparison"""
        fig = go.Figure()
        
        for col in y_columns:
            fig.add_trace(go.Violin(
                y=df[col],
                name=col,
                box_visible=True,
                meanline_visible=True,
                points='all'
            ))
        
        # Get Y-axis label
        y_label = ', '.join(y_columns) if len(y_columns) > 1 else y_columns[0]
        
        fig.update_layout(
            title=f'Violin Plot: Distribution of {", ".join(y_columns)}',
            yaxis_title=y_label,
            template='plotly_white',
            violinmode='group',
            height=500
        )
        return fig
    
    def _create_sunburst_chart(self, x_columns, y_columns, df):
        """Create sunburst chart for hierarchical data"""
        if len(x_columns) > 1:
            fig = go.Figure(go.Sunburst(
                labels=df[x_columns[-1]],
                parents=df[x_columns[0]] if len(x_columns) == 2 else df[x_columns[0]],
                values=df[y_columns[0]],
                branchvalues='total'
            ))
        else:
            if len(df) > 10:
                sun_df = df.groupby(x_columns[0])[y_columns[0]].sum().reset_index()
            else:
                sun_df = df
            
            fig = go.Figure(go.Sunburst(
                labels=sun_df[x_columns[0]],
                parents=[''] * len(sun_df),
                values=sun_df[y_columns[0]],
                branchvalues='total'
            ))
        
        fig.update_layout(
            title=f'Sunburst Chart: {y_columns[0]} Distribution',
            template='plotly_white',
            height=500
        )
        return fig
    
    def generate_table(self, x_columns, y_columns):
        """Generate table data for display"""
        columns_to_show = x_columns + y_columns
        table_df = self.df[columns_to_show].head(100)
        
        data = []
        for _, row in table_df.iterrows():
            row_dict = {}
            for col in columns_to_show:
                value = row[col]
                if pd.isna(value):
                    row_dict[col] = None
                elif isinstance(value, (np.integer, np.floating)):
                    row_dict[col] = float(value) if not pd.isna(value) else None
                elif isinstance(value, (np.bool_)):
                    row_dict[col] = bool(value)
                else:
                    row_dict[col] = value
            data.append(row_dict)
        
        return {
            'columns': columns_to_show,
            'data': data,
            'shape': f'{len(table_df)} rows displayed (of {len(self.df)} total)'
        }
    
    def get_statistics(self, columns):
        """Get statistics for specified columns"""
        stats = {}
        for col in columns:
            if col in self.df.columns:
                col_data = self.df[col].dropna()
                if pd.api.types.is_numeric_dtype(col_data):
                    stats[col] = {
                        'mean': float(col_data.mean()) if not pd.isna(col_data.mean()) else None,
                        'median': float(col_data.median()) if not pd.isna(col_data.median()) else None,
                        'std': float(col_data.std()) if not pd.isna(col_data.std()) else None,
                        'min': float(col_data.min()) if not pd.isna(col_data.min()) else None,
                        'max': float(col_data.max()) if not pd.isna(col_data.max()) else None,
                        'count': int(col_data.count()),
                        'unique': int(col_data.nunique()),
                        'skew': float(col_data.skew()) if len(col_data) > 2 and not pd.isna(col_data.skew()) else None,
                        'kurtosis': float(col_data.kurtosis()) if len(col_data) > 3 and not pd.isna(col_data.kurtosis()) else None
                    }
                else:
                    unique_vals = col_data.unique().tolist()[:10]
                    unique_vals = [None if pd.isna(v) else v for v in unique_vals]
                    stats[col] = {
                        'unique_values': unique_vals,
                        'count': int(col_data.count()),
                        'unique_count': int(col_data.nunique())
                    }
        return stats
    
    def get_file_info(self):
        """Get information about the loaded file"""
        if self.df is None:
            return None
        
        file_stats = {}
        if self.current_file_path and os.path.exists(self.current_file_path):
            stat = os.stat(self.current_file_path)
            file_stats = {
                'size': stat.st_size,
                'size_mb': stat.st_size / (1024 * 1024),
                'created': datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            }
        
        return {
            'filename': os.path.basename(self.filename) if self.filename else 'Unknown',
            'file_type': self.file_extension or 'Unknown',
            'rows': len(self.df),
            'columns': len(self.df.columns),
            'memory_usage': self.df.memory_usage(deep=True).sum() / 1024 / 1024,
            'numeric_columns': len([col for col in self.df.columns if pd.api.types.is_numeric_dtype(self.df[col])]),
            'categorical_columns': len([col for col in self.df.columns if pd.api.types.is_categorical_dtype(self.df[col]) or pd.api.types.is_object_dtype(self.df[col])]),
            'file_stats': file_stats
        }
    
    def fig_to_json(self, fig):
        """Convert plotly figure to JSON"""
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)