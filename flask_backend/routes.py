from flask import Blueprint, render_template, request, jsonify, send_file
from .excel import ExcelAnalyzer
import os
import json
import traceback
import shutil
from datetime import datetime

main = Blueprint('main', __name__)

# Global instance
excel_analyzer = ExcelAnalyzer()

def get_upload_folder():
    """Get the upload folder path"""
    upload_folder = main.root_path + '/uploads'
    os.makedirs(upload_folder, exist_ok=True)
    return upload_folder

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file extension
    allowed_extensions = {'.xlsx', '.xls', '.xlsm', '.xlsb', '.ods', '.csv'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': f'Unsupported file format. Please upload: {", ".join(allowed_extensions)}'}), 400
    
    try:
        # Get upload folder
        upload_folder = get_upload_folder()
        
        # Generate unique filename to avoid conflicts
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(upload_folder, unique_filename)
        
        # Save the file
        file.save(filepath)
        
        # Read file using ExcelAnalyzer
        result = excel_analyzer.load_file(filepath)
        
        if result['success']:
            # Get file info
            file_info = excel_analyzer.get_file_info()
            
            # Ensure all values are JSON serializable
            response_data = {
                'success': True,
                'columns': result['columns'],
                'sample_data': result['sample_data'],
                'shape': result['shape'],
                'filename': unique_filename,
                'original_filename': file.filename,
                'file_type': result.get('file_type', file_ext),
                'file_info': file_info
            }
            
            return jsonify(response_data)
        else:
            # Clean up failed upload
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': result['error']}), 400
    
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@main.route('/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    try:
        upload_folder = get_upload_folder()
        files = []
        
        for filename in os.listdir(upload_folder):
            filepath = os.path.join(upload_folder, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created': datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                    'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'extension': os.path.splitext(filename)[1].lower()
                })
        
        # Sort by creation date (newest first)
        files.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/files/<filename>', methods=['GET'])
def get_file(filename):
    """Get a specific file's data"""
    try:
        upload_folder = get_upload_folder()
        filepath = os.path.join(upload_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Load the file
        result = excel_analyzer.load_file(filepath)
        
        if result['success']:
            file_info = excel_analyzer.get_file_info()
            return jsonify({
                'success': True,
                'columns': result['columns'],
                'sample_data': result['sample_data'],
                'shape': result['shape'],
                'filename': filename,
                'file_type': result.get('file_type'),
                'file_info': file_info
            })
        else:
            return jsonify({'error': result['error']}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a file"""
    try:
        upload_folder = get_upload_folder()
        filepath = os.path.join(upload_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # If this is the currently loaded file, clear the analyzer
        if excel_analyzer.current_file_path == filepath:
            excel_analyzer.df = None
            excel_analyzer.filename = None
            excel_analyzer.file_extension = None
            excel_analyzer.current_file_path = None
        
        # Delete the file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': f'File {filename} deleted successfully'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/files/<filename>/download', methods=['GET'])
def download_file(filename):
    """Download a file"""
    try:
        upload_folder = get_upload_folder()
        filepath = os.path.join(upload_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/files/clear_all', methods=['DELETE'])
def clear_all_files():
    """Delete all files"""
    try:
        upload_folder = get_upload_folder()
        
        # Clear the analyzer
        excel_analyzer.df = None
        excel_analyzer.filename = None
        excel_analyzer.file_extension = None
        excel_analyzer.current_file_path = None
        
        # Delete all files in upload folder
        for filename in os.listdir(upload_folder):
            filepath = os.path.join(upload_folder, filename)
            if os.path.isfile(filepath):
                os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': 'All files deleted successfully'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/analyze', methods=['POST'])
def analyze_data():
    if excel_analyzer.df is None:
        return jsonify({'error': 'No data uploaded'}), 400
    
    try:
        data = request.json
        x_columns = data.get('x_columns', [])
        y_columns = data.get('y_columns', [])
        chart_type = data.get('chart_type', 'bar')
        display_type = data.get('display_type', 'graph')
        
        if not x_columns or not y_columns:
            return jsonify({'error': 'Please select X and Y columns'}), 400
        
        # Generate visualization
        if display_type == 'graph':
            fig = excel_analyzer.create_chart(x_columns, y_columns, chart_type)
            if fig is None:
                return jsonify({'error': 'Could not generate chart. Please check your data.'}), 400
            graph_json = excel_analyzer.fig_to_json(fig)
            return jsonify({
                'success': True,
                'graph': graph_json,
                'display_type': 'graph'
            })
        else:
            table_data = excel_analyzer.generate_table(x_columns, y_columns)
            return jsonify({
                'success': True,
                'table': table_data,
                'display_type': 'table'
            })
    
    except Exception as e:
        print(f"Error analyzing data: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Error analyzing data: {str(e)}'}), 500

@main.route('/get_stats', methods=['POST'])
def get_statistics():
    if excel_analyzer.df is None:
        return jsonify({'error': 'No data uploaded'}), 400
    
    try:
        data = request.json
        columns = data.get('columns', [])
        stats = excel_analyzer.get_statistics(columns)
        return jsonify({'success': True, 'statistics': stats})
    
    except Exception as e:
        print(f"Error getting statistics: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Error getting statistics: {str(e)}'}), 500

@main.route('/get_file_info', methods=['GET'])
def get_file_info():
    if excel_analyzer.df is None:
        return jsonify({'error': 'No data uploaded'}), 400
    
    try:
        file_info = excel_analyzer.get_file_info()
        return jsonify({'success': True, 'file_info': file_info})
    
    except Exception as e:
        print(f"Error getting file info: {str(e)}")
        return jsonify({'error': f'Error getting file info: {str(e)}'}), 500