$(document).ready(function() {
    // Theme toggle
    $('#themeToggle').on('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        $(this).html(`<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`);
        localStorage.setItem('theme', newTheme);
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    $('#themeToggle').html(`<i class="fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`);
    
    // Initialize modals
    const fileInfoModal = new bootstrap.Modal(document.getElementById('fileInfoModal'));
    const dataPreviewModal = new bootstrap.Modal(document.getElementById('dataPreviewModal'));
    const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
    
    // Load files on page load
    loadFileList();
    
    // Handle file upload
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const fileInput = $('#fileInput')[0];
        
        if (!fileInput.files || !fileInput.files[0]) {
            showStatus('Please select a file to upload.', 'danger');
            return;
        }
        
        showStatus('Uploading and analyzing file...', 'info');
        $('#analysisSection').hide();
        $('#emptyState').hide();
        $('#results').hide();
        
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showStatus('File uploaded successfully!', 'success');
                    populateColumns(response.columns);
                    updateCurrentFileBadge(response.original_filename || response.filename);
                    $('#analysisSection').show();
                    $('#emptyState').hide();
                    loadFileList();
                    // Show file info in modal
                    showFileInfoModal(response.file_info);
                } else {
                    showStatus('Error: ' + (response.error || 'Unknown error'), 'danger');
                }
            },
            error: function(xhr, status, error) {
                let errorMsg = 'Upload failed: ';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg += response.error || error;
                } catch(e) {
                    errorMsg += error;
                }
                showStatus(errorMsg, 'danger');
            }
        });
    });
    
    // Refresh files button
    $('#refreshFilesBtn').on('click', function() {
        loadFileList();
    });
    
    // Clear all files
    $('#clearAllFiles').on('click', function() {
        if (!confirm('Are you sure you want to delete all uploaded files?')) {
            return;
        }
        
        $.ajax({
            url: '/files/clear_all',
            type: 'DELETE',
            success: function(response) {
                if (response.success) {
                    showStatus('All files deleted successfully', 'success');
                    loadFileList();
                    $('#analysisSection').hide();
                    $('#emptyState').show();
                    $('#results').hide();
                    $('#xColumns').empty();
                    $('#yColumns').empty();
                    updateCurrentFileBadge('No file loaded');
                }
            },
            error: function(xhr, status, error) {
                showStatus('Error clearing files: ' + error, 'danger');
            }
        });
    });
    
    // Show statistics button
    $('#showStatsBtn').on('click', function() {
        const xColumns = $('#xColumns').val() || [];
        const yColumns = $('#yColumns').val() || [];
        const allColumns = [...xColumns, ...yColumns];
        
        if (allColumns.length === 0) {
            showStatus('Please select columns to analyze.', 'warning');
            return;
        }
        
        showStatsModal(allColumns);
    });
    
    // Load file list
    function loadFileList() {
        $.ajax({
            url: '/files',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    displayFileList(response.files, response.count);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading files:', error);
            }
        });
    }
    
    // Display file list
    function displayFileList(files, count) {
        const fileList = $('#fileList');
        const fileCount = $('#fileCount');
        
        if (!files || files.length === 0) {
            fileList.html(`
                <div class="list-group-item text-center text-muted py-4">
                    <i class="fas fa-cloud-upload-alt fa-3x d-block mb-2"></i>
                    No files uploaded yet
                </div>
            `);
            fileCount.html('<small class="text-muted">No files uploaded</small>');
            return;
        }
        
        fileCount.html(`<small class="text-muted">${count} file${count > 1 ? 's' : ''} uploaded</small>`);
        
        let html = '';
        files.forEach((file) => {
            const iconClass = getFileIconClass(file.extension);
            const badgeColor = getFileBadgeColor(file.extension);
            
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center" style="flex: 1; min-width: 0;">
                        <i class="fas ${iconClass} file-icon me-2"></i>
                        <span class="file-name text-truncate" data-filename="${file.filename}" style="cursor: pointer;">
                            ${file.filename}
                        </span>
                        <span class="badge badge-file bg-${badgeColor} ms-2 flex-shrink-0">${file.extension || 'Unknown'}</span>
                    </div>
                    <div class="file-actions flex-shrink-0 ms-2">
                        <button class="btn btn-primary btn-sm load-file-btn" data-filename="${file.filename}" title="Load this file for analysis">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="btn btn-info btn-sm preview-btn" data-filename="${file.filename}" title="Preview Data">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm download-btn" data-filename="${file.filename}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-filename="${file.filename}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        fileList.html(html);
        
        // Add event listeners
        fileList.find('.file-name').on('click', function() {
            const filename = $(this).data('filename');
            showFileInfoModal(filename);
        });
        
        fileList.find('.load-file-btn').on('click', function(e) {
            e.stopPropagation();
            const filename = $(this).data('filename');
            loadFileForAnalysis(filename);
        });
        
        fileList.find('.preview-btn').on('click', function(e) {
            e.stopPropagation();
            const filename = $(this).data('filename');
            showDataPreviewModal(filename);
        });
        
        fileList.find('.download-btn').on('click', function(e) {
            e.stopPropagation();
            const filename = $(this).data('filename');
            window.location.href = `/files/${filename}/download`;
        });
        
        fileList.find('.delete-btn').on('click', function(e) {
            e.stopPropagation();
            const filename = $(this).data('filename');
            deleteFile(filename);
        });
    }
    
    // Get file icon class
    function getFileIconClass(extension) {
        const icons = {
            '.csv': 'fa-file-csv text-success',
            '.xlsx': 'fa-file-excel text-primary',
            '.xls': 'fa-file-excel text-primary',
            '.xlsm': 'fa-file-excel text-warning',
            '.xlsb': 'fa-file-excel text-info',
            '.ods': 'fa-file-excel text-secondary'
        };
        return icons[extension] || 'fa-file text-muted';
    }
    
    // Get file badge color
    function getFileBadgeColor(extension) {
        const colors = {
            '.csv': 'success',
            '.xlsx': 'primary',
            '.xls': 'primary',
            '.xlsm': 'warning',
            '.xlsb': 'info',
            '.ods': 'secondary'
        };
        return colors[extension] || 'secondary';
    }
    
    // Load file for analysis
    function loadFileForAnalysis(filename) {
        showStatus(`Loading ${filename} for analysis...`, 'info');
        
        $.ajax({
            url: `/files/${filename}`,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    // Update the UI with the loaded file data
                    populateColumns(response.columns);
                    updateCurrentFileBadge(response.filename);
                    $('#analysisSection').show();
                    $('#emptyState').hide();
                    $('#results').hide();
                    showStatus(`File ${filename} loaded successfully!`, 'success');
                    
                    // Show file info in modal
                    showFileInfoModal(response.file_info);
                    
                    // Highlight the loaded file in the list
                    highlightLoadedFile(filename);
                } else {
                    showStatus('Error loading file: ' + response.error, 'danger');
                }
            },
            error: function(xhr, status, error) {
                showStatus('Error loading file: ' + error, 'danger');
            }
        });
    }
    
    // Highlight the loaded file in the list
    function highlightLoadedFile(filename) {
        // Remove any existing highlights
        $('.list-group-item').removeClass('bg-primary bg-opacity-10');
        
        // Find the file item and highlight it
        $('.list-group-item').each(function() {
            const fileSpan = $(this).find('.file-name');
            if (fileSpan.length && fileSpan.data('filename') === filename) {
                $(this).addClass('bg-primary bg-opacity-10');
            }
        });
    }
    
    // Update current file badge
    function updateCurrentFileBadge(filename) {
        $('#currentFileName').text(filename || 'No file loaded');
        if (filename && filename !== 'No file loaded') {
            $('#currentFileBadge').show();
        } else {
            $('#currentFileBadge').hide();
        }
    }
    
    // Delete a file
    function deleteFile(filename) {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) {
            return;
        }
        
        $.ajax({
            url: `/files/${filename}`,
            type: 'DELETE',
            success: function(response) {
                if (response.success) {
                    showStatus(`File ${filename} deleted successfully`, 'success');
                    loadFileList();
                    
                    // If this was the currently loaded file, clear the UI
                    if ($('#analysisSection').is(':visible')) {
                        $('#analysisSection').hide();
                        $('#emptyState').show();
                        $('#results').hide();
                        $('#xColumns').empty();
                        $('#yColumns').empty();
                        updateCurrentFileBadge('No file loaded');
                    }
                } else {
                    showStatus('Error deleting file: ' + response.error, 'danger');
                }
            },
            error: function(xhr, status, error) {
                showStatus('Error deleting file: ' + error, 'danger');
            }
        });
    }
    
    // Show file info modal
    function showFileInfoModal(filename) {
        $('#fileInfoModalBody').html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Loading file information...</p>
            </div>
        `);
        fileInfoModal.show();
        
        if (typeof filename === 'string') {
            $.ajax({
                url: `/files/${filename}`,
                type: 'GET',
                success: function(response) {
                    if (response.success) {
                        displayFileInfo(response.file_info);
                    } else {
                        $('#fileInfoModalBody').html(`<div class="alert alert-danger">${response.error}</div>`);
                    }
                },
                error: function() {
                    $('#fileInfoModalBody').html(`<div class="alert alert-danger">Error loading file information</div>`);
                }
            });
        } else {
            displayFileInfo(filename);
        }
    }
    
    // Display file info
    function displayFileInfo(fileInfo) {
        if (!fileInfo) {
            $('#fileInfoModalBody').html(`<div class="alert alert-warning">No file information available</div>`);
            return;
        }
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-card">
                        <h6>File Name</h6>
                        <h5>${fileInfo.filename || 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>File Type</h6>
                        <h5>${fileInfo.file_type || 'Unknown'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Rows</h6>
                        <h5>${fileInfo.rows ? fileInfo.rows.toLocaleString() : 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Columns</h6>
                        <h5>${fileInfo.columns || 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Memory Usage</h6>
                        <h5>${fileInfo.memory_usage ? fileInfo.memory_usage.toFixed(2) + ' MB' : 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Numeric Columns</h6>
                        <h5>${fileInfo.numeric_columns || 0}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Categorical Columns</h6>
                        <h5>${fileInfo.categorical_columns || 0}</h5>
                    </div>
                </div>
        `;
        
        if (fileInfo.file_stats) {
            html += `
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>File Size</h6>
                        <h5>${fileInfo.file_stats.size_mb ? fileInfo.file_stats.size_mb.toFixed(2) + ' MB' : 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Created</h6>
                        <h5>${fileInfo.file_stats.created || 'N/A'}</h5>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Modified</h6>
                        <h5>${fileInfo.file_stats.modified || 'N/A'}</h5>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        $('#fileInfoModalBody').html(html);
    }
    
    // Show data preview modal
    function showDataPreviewModal(filename) {
        $('#dataPreviewModalBody').html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Loading data preview...</p>
            </div>
        `);
        dataPreviewModal.show();
        
        $.ajax({
            url: `/files/${filename}`,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    displayDataPreview(response.sample_data, response.columns, response.shape);
                } else {
                    $('#dataPreviewModalBody').html(`<div class="alert alert-danger">${response.error}</div>`);
                }
            },
            error: function() {
                $('#dataPreviewModalBody').html(`<div class="alert alert-danger">Error loading data preview</div>`);
            }
        });
    }
    
    // Display data preview
    function displayDataPreview(data, columns, shape) {
        if (!data || data.length === 0 || !columns || columns.length === 0) {
            $('#dataPreviewModalBody').html(`<div class="alert alert-warning">No data available</div>`);
            return;
        }
        
        let html = `<p class="text-muted">${shape}</p><div class="table-responsive"><table class="table table-striped table-hover"><thead><tr>`;
        
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += `</tr></thead><tbody>`;
        
        data.forEach(row => {
            html += `<tr>`;
            columns.forEach(col => {
                const value = row[col];
                const displayValue = (value === null || value === undefined) ? '' : 
                                    (typeof value === 'object' ? JSON.stringify(value) : value);
                html += `<td>${displayValue}</td>`;
            });
            html += `</tr>`;
        });
        
        html += `</tbody></table></div>`;
        $('#dataPreviewModalBody').html(html);
    }
    
    // Show statistics modal
    function showStatsModal(columns) {
        $('#statsModalBody').html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Loading statistics...</p>
            </div>
        `);
        statsModal.show();
        
        $.ajax({
            url: '/get_stats',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ columns: columns }),
            success: function(response) {
                if (response.success) {
                    displayStatistics(response.statistics);
                } else {
                    $('#statsModalBody').html(`<div class="alert alert-danger">${response.error}</div>`);
                }
            },
            error: function(xhr, status, error) {
                $('#statsModalBody').html(`<div class="alert alert-danger">Error loading statistics: ${error}</div>`);
            }
        });
    }
    
    // Display statistics
    function displayStatistics(stats) {
        if (!stats || Object.keys(stats).length === 0) {
            $('#statsModalBody').html('<p class="text-muted">No statistics available for selected columns.</p>');
            return;
        }
        
        let html = '';
        
        Object.keys(stats).forEach(col => {
            const colStats = stats[col];
            html += `<div class="stat-card">
                <h6><i class="fas fa-columns me-2"></i>${col}</h6>
                <div class="stat-grid">`;
            
            if (colStats.mean !== undefined && colStats.mean !== null) {
                html += `
                    <div class="stat-item">
                        <span class="label">Mean</span>
                        <span class="value">${colStats.mean.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Median</span>
                        <span class="value">${colStats.median ? colStats.median.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Std Dev</span>
                        <span class="value">${colStats.std ? colStats.std.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Min</span>
                        <span class="value">${colStats.min ? colStats.min.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Max</span>
                        <span class="value">${colStats.max ? colStats.max.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Count</span>
                        <span class="value">${colStats.count}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Unique</span>
                        <span class="value">${colStats.unique}</span>
                    </div>
                `;
                if (colStats.skew !== undefined && colStats.skew !== null) {
                    html += `
                        <div class="stat-item">
                            <span class="label">Skewness</span>
                            <span class="value">${colStats.skew.toFixed(2)}</span>
                        </div>
                    `;
                }
                if (colStats.kurtosis !== undefined && colStats.kurtosis !== null) {
                    html += `
                        <div class="stat-item">
                            <span class="label">Kurtosis</span>
                            <span class="value">${colStats.kurtosis.toFixed(2)}</span>
                        </div>
                    `;
                }
            } else {
                html += `
                    <div class="stat-item">
                        <span class="label">Count</span>
                        <span class="value">${colStats.count}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Unique Values</span>
                        <span class="value">${colStats.unique_count}</span>
                    </div>
                    <div class="stat-item" style="grid-column: span 2;">
                        <span class="label">Sample Values</span>
                        <span class="value" style="font-size: 12px; word-break: break-all;">${(colStats.unique_values || []).join(', ')}</span>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        });
        
        $('#statsModalBody').html(html);
    }
    
    // Handle analysis generation
    $('#analysisForm').on('submit', function(e) {
        e.preventDefault();
        generateAnalysis();
    });
    
    // Generate analysis
    function generateAnalysis() {
        const xColumns = $('#xColumns').val() || [];
        const yColumns = $('#yColumns').val() || [];
        const chartType = $('#chartType').val();
        const displayType = $('#displayType').val();
        
        if (xColumns.length === 0 || yColumns.length === 0) {
            showStatus('Please select both X and Y axis columns.', 'warning');
            return;
        }
        
        $('#resultContent').html('<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Generating analysis...</p></div>');
        $('#results').show();
        
        $.ajax({
            url: '/analyze',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                x_columns: xColumns,
                y_columns: yColumns,
                chart_type: chartType,
                display_type: displayType
            }),
            success: function(response) {
                if (response.success) {
                    $('#resultContent').html('');
                    
                    if (response.display_type === 'graph') {
                        displayGraph(response.graph);
                    } else {
                        displayTable(response.table);
                    }
                } else {
                    $('#resultContent').html(`<div class="alert alert-danger">Error: ${response.error}</div>`);
                }
            },
            error: function(xhr, status, error) {
                let errorMsg = 'Analysis failed: ';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg += response.error || error;
                } catch(e) {
                    errorMsg += error;
                }
                $('#resultContent').html(`<div class="alert alert-danger">${errorMsg}</div>`);
            }
        });
    }
    
    // Display graph
    function displayGraph(graphJSON) {
        try {
            if (typeof Plotly === 'undefined') {
                $('#resultContent').html(`<div class="alert alert-danger">Plotly library not loaded. Please refresh the page.</div>`);
                return;
            }
            
            const graphData = JSON.parse(graphJSON);
            $('#resultContent').html('<div id="plotly-graph" style="width: 100%; height: 500px;"></div>');
            
            Plotly.newPlot('plotly-graph', graphData.data, graphData.layout, {
                responsive: true,
                displayModeBar: true,
                modeBarButtonsToRemove: ['toImage']
            });
            
        } catch (error) {
            console.error('Error displaying graph:', error);
            $('#resultContent').html(`<div class="alert alert-danger">Error displaying graph: ${error.message}</div>`);
        }
    }
    
    // Display table
    function displayTable(tableData) {
        if (!tableData || !tableData.columns || !tableData.data) {
            $('#resultContent').html(`<div class="alert alert-danger">No table data available</div>`);
            return;
        }
        
        let html = `<div class="table-responsive">
            <p class="text-muted">${tableData.shape || ''}</p>
            <table class="table table-striped table-hover">
                <thead>
                    <tr>`;
        
        tableData.columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += `</tr></thead><tbody>`;
        
        if (tableData.data.length === 0) {
            html += `<tr><td colspan="${tableData.columns.length}" class="text-center">No data to display</td></tr>`;
        } else {
            tableData.data.forEach(row => {
                html += `<tr>`;
                tableData.columns.forEach(col => {
                    const value = row[col];
                    const displayValue = (value === null || value === undefined) ? '' : 
                                        (typeof value === 'object' ? JSON.stringify(value) : value);
                    html += `<td>${displayValue}</td>`;
                });
                html += `</tr>`;
            });
        }
        
        html += `</tbody></table></div>`;
        $('#resultContent').html(html);
    }
    
    // Show status message
    function showStatus(message, type) {
        const statusDiv = $('#uploadStatus');
        statusDiv.html(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`);
    }
    
    // Populate column selectors
    function populateColumns(columns) {
        const xSelect = $('#xColumns');
        const ySelect = $('#yColumns');
        
        xSelect.empty();
        ySelect.empty();
        
        if (!columns || columns.length === 0) {
            xSelect.append('<option value="">No columns found</option>');
            ySelect.append('<option value="">No columns found</option>');
            return;
        }
        
        columns.forEach(col => {
            xSelect.append(`<option value="${col}">${col}</option>`);
            ySelect.append(`<option value="${col}">${col}</option>`);
        });
    }
});