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
    const countValuesModal = new bootstrap.Modal(document.getElementById('countValuesModal'));
    
    // Analysis counter
    let analysisCount = 0;
    const MAX_ANALYSIS = 4;
    
    // Store current settings
    let currentSettings = {
        xColumns: [],
        yColumns: [],
        chartType: 'bar',
        displayType: 'graph'
    };
    
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
                    // Clear previous results
                    clearAllAnalyses();
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
    
    // Update current settings from form
    function updateCurrentSettings() {
        currentSettings.xColumns = $('#xColumns').val() || [];
        currentSettings.yColumns = $('#yColumns').val() || [];
        currentSettings.chartType = $('#chartType').val();
        currentSettings.displayType = $('#displayType').val();
    }
    
    // Add new analysis
    $('#addNewAnalysis').on('click', function() {
        if (analysisCount >= MAX_ANALYSIS) {
            showStatus(`Maximum ${MAX_ANALYSIS} analyses allowed.`, 'warning');
            return;
        }
        createNewAnalysisItem();
    });
    
    // Create new analysis item
    function createNewAnalysisItem(settings) {
        // If settings not provided, use current settings
        if (!settings) {
            updateCurrentSettings();
            settings = currentSettings;
        }
        
        // Validate settings
        if (!settings.xColumns || settings.xColumns.length === 0 || 
            !settings.yColumns || settings.yColumns.length === 0) {
            showStatus('Please select both X and Y axis columns.', 'warning');
            return null;
        }
        
        const analysisId = `analysis-${Date.now()}`;
        analysisCount++;
        updateAnalysisCount();
        
        // Get column options
        const xOptions = getColumnOptions(settings.xColumns);
        const yOptions = getColumnOptions(settings.yColumns);
        
        const template = `
            <div class="analysis-item card mb-3" id="${analysisId}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">Analysis ${analysisCount}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-danger remove-analysis" data-id="${analysisId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="analysis-controls mb-3">
                        <div class="row g-2">
                            <div class="col-md-6">
                                <label class="form-label small">X-Axis</label>
                                <select class="form-select form-select-sm analysis-x" multiple size="2">
                                    ${xOptions}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small">Y-Axis</label>
                                <select class="form-select form-select-sm analysis-y" multiple size="2">
                                    ${yOptions}
                                </select>
                            </div>
                        </div>
                        <div class="row g-2 mt-2">
                            <div class="col-md-4">
                                <label class="form-label small">Chart Type</label>
                                <select class="form-select form-select-sm analysis-chart">
                                    ${getChartOptions(settings.chartType)}
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small">Display</label>
                                <select class="form-select form-select-sm analysis-display">
                                    <option value="graph" ${settings.displayType === 'graph' ? 'selected' : ''}>Graph</option>
                                    <option value="table" ${settings.displayType === 'table' ? 'selected' : ''}>Table</option>
                                </select>
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button class="btn btn-sm btn-success w-100 generate-analysis" data-id="${analysisId}">
                                    <i class="fas fa-play me-1"></i>Generate
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="analysis-result" id="result-${analysisId}">
                        <div class="text-center text-muted py-3">
                            <i class="fas fa-info-circle"></i>
                            <p class="small mb-0">Ready to generate</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#analysisItems').append(template);
        $('#noResults').hide();
        
        // Event listeners for this analysis
        $(`#${analysisId} .remove-analysis`).on('click', function() {
            const id = $(this).data('id');
            removeAnalysis(id);
        });
        
        $(`#${analysisId} .generate-analysis`).on('click', function() {
            const id = $(this).data('id');
            generateSingleAnalysis(id);
        });
        
        // Add filter controls for table views
        addFilterControls(analysisId);
        
        showStatus(`Analysis ${analysisCount} added!`, 'success');
        return analysisId;
    }
    
    // Get column options HTML
    function getColumnOptions(selectedColumns) {
        const allColumns = $('#xColumns option');
        if (allColumns.length === 0) {
            return '<option value="">No columns available</option>';
        }
        
        let html = '';
        allColumns.each(function() {
            const value = $(this).val();
            const text = $(this).text();
            const selected = selectedColumns && selectedColumns.includes(value) ? 'selected' : '';
            html += `<option value="${value}" ${selected}>${text}</option>`;
        });
        return html;
    }
    
    // Get chart options HTML
    function getChartOptions(selectedChart) {
        const chartSelect = $('#chartType');
        let html = '';
        chartSelect.find('optgroup').each(function() {
            const groupLabel = $(this).attr('label');
            html += `<optgroup label="${groupLabel}">`;
            $(this).find('option').each(function() {
                const value = $(this).val();
                const text = $(this).text();
                const selected = value === selectedChart ? 'selected' : '';
                html += `<option value="${value}" ${selected}>${text}</option>`;
            });
            html += `</optgroup>`;
        });
        return html;
    }
    
    // Add filter controls to analysis
    function addFilterControls(analysisId) {
        const resultDiv = $(`#result-${analysisId}`);
        const filterHtml = `
            <div class="filter-controls mt-2" style="display:none;">
                <div class="input-group input-group-sm">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control filter-input" placeholder="Filter results..." data-id="${analysisId}">
                    <button class="btn btn-outline-secondary clear-filter" data-id="${analysisId}">Clear</button>
                </div>
            </div>
        `;
        resultDiv.append(filterHtml);
    }
    
    // Generate single analysis
    function generateSingleAnalysis(analysisId) {
        const item = $(`#${analysisId}`);
        const xColumns = item.find('.analysis-x').val() || [];
        const yColumns = item.find('.analysis-y').val() || [];
        const chartType = item.find('.analysis-chart').val();
        const displayType = item.find('.analysis-display').val();
        
        if (xColumns.length === 0 || yColumns.length === 0) {
            showStatus('Please select both X and Y axis columns for this analysis.', 'warning');
            return;
        }
        
        const resultDiv = $(`#result-${analysisId}`);
        resultDiv.html('<div class="text-center p-3"><div class="spinner-border spinner-border-sm text-primary" role="status"></div><p class="small mt-2">Generating...</p></div>');
        
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
                    resultDiv.html('');
                    if (response.display_type === 'graph') {
                        displayGraphInResult(resultDiv, response.graph);
                    } else {
                        displayTableInResult(resultDiv, response.table, analysisId);
                    }
                    // Show filter controls for tables
                    if (response.display_type === 'table') {
                        resultDiv.find('.filter-controls').show();
                    } else {
                        resultDiv.find('.filter-controls').hide();
                    }
                } else {
                    resultDiv.html(`<div class="alert alert-danger">${response.error}</div>`);
                }
            },
            error: function(xhr, status, error) {
                resultDiv.html(`<div class="alert alert-danger">Error: ${error}</div>`);
            }
        });
    }
    
    // Display graph in result
    function displayGraphInResult(container, graphJSON) {
        try {
            if (typeof Plotly === 'undefined') {
                container.html(`<div class="alert alert-danger">Plotly library not loaded.</div>`);
                return;
            }
            
            const graphData = JSON.parse(graphJSON);
            const graphId = `plotly-${Date.now()}`;
            container.html(`<div id="${graphId}" style="width:100%;height:400px;"></div>`);
            
            Plotly.newPlot(graphId, graphData.data, graphData.layout, {
                responsive: true,
                displayModeBar: true,
                modeBarButtonsToRemove: ['toImage']
            });
        } catch (error) {
            container.html(`<div class="alert alert-danger">Error displaying graph: ${error.message}</div>`);
        }
    }
    
    // Display table in result
    function displayTableInResult(container, tableData, analysisId) {
        if (!tableData || !tableData.columns || !tableData.data) {
            container.html(`<div class="alert alert-danger">No table data available</div>`);
            return;
        }
        
        let html = `<div class="table-responsive">
            <p class="text-muted small">${tableData.shape || ''}</p>
            <table class="table table-striped table-hover table-sm" id="table-${analysisId}">
                <thead><tr>`;
        
        tableData.columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += `</tr></thead><tbody>`;
        
        if (tableData.data.length === 0) {
            html += `<tr><td colspan="${tableData.columns.length}" class="text-center">No data</td></tr>`;
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
        container.html(html);
        
        // Add filter functionality
        const filterInput = container.find('.filter-input');
        filterInput.on('keyup', function() {
            const filter = $(this).val().toLowerCase();
            const tableId = `#table-${analysisId}`;
            $(`${tableId} tbody tr`).filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(filter) > -1);
            });
        });
        
        container.find('.clear-filter').on('click', function() {
            const input = $(this).siblings('.filter-input');
            input.val('');
            input.trigger('keyup');
        });
    }
    
    // Remove analysis
    function removeAnalysis(analysisId) {
        if (analysisCount > 1) {
            $(`#${analysisId}`).remove();
            analysisCount--;
            updateAnalysisCount();
            
            if (analysisCount === 0) {
                $('#noResults').show();
            }
            
            // Re-number remaining analyses
            $('#analysisItems .analysis-item').each(function(index) {
                $(this).find('.badge').text(`Analysis ${index + 1}`);
            });
        } else {
            showStatus('Keep at least one analysis.', 'warning');
        }
    }
    
    // Clear all analyses
    function clearAllAnalyses() {
        $('#analysisItems').empty();
        analysisCount = 0;
        updateAnalysisCount();
        $('#noResults').show();
    }
    
    // Update analysis count
    function updateAnalysisCount() {
        $('#analysisCount').text(`${analysisCount}/${MAX_ANALYSIS}`);
        if (analysisCount >= MAX_ANALYSIS) {
            $('#addNewAnalysis').prop('disabled', true);
            $('#addNewAnalysis').addClass('btn-secondary').removeClass('btn-light');
        } else {
            $('#addNewAnalysis').prop('disabled', false);
            $('#addNewAnalysis').removeClass('btn-secondary').addClass('btn-light');
        }
    }
    
    // Count Values feature
    $('#countValuesBtn').on('click', function() {
        const xColumns = $('#xColumns').val() || [];
        const yColumns = $('#yColumns').val() || [];
        const allColumns = [...xColumns, ...yColumns];
        
        if (allColumns.length === 0) {
            showStatus('Please select columns to count.', 'warning');
            return;
        }
        
        showCountValuesModal(allColumns);
    });
    
    // Show count values modal
    function showCountValuesModal(columns) {
        $('#countValuesModalBody').html(`
            <div class="text-center">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Counting values...</p>
            </div>
        `);
        countValuesModal.show();
        
        $.ajax({
            url: '/get_stats',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ columns: columns }),
            success: function(response) {
                if (response.success) {
                    displayValueCounts(response.statistics);
                } else {
                    $('#countValuesModalBody').html(`<div class="alert alert-danger">${response.error}</div>`);
                }
            },
            error: function(xhr, status, error) {
                $('#countValuesModalBody').html(`<div class="alert alert-danger">Error: ${error}</div>`);
            }
        });
    }
    
    // Display value counts
    function displayValueCounts(stats) {
        let html = '<div class="row">';
        
        Object.keys(stats).forEach(col => {
            const colStats = stats[col];
            html += `
                <div class="col-md-6 mb-3">
                    <div class="stat-card">
                        <h6><i class="fas fa-columns me-2"></i>${col}</h6>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="label">Count</span>
                                <span class="value">${colStats.count}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Unique Values</span>
                                <span class="value">${colStats.unique_count || colStats.unique || 'N/A'}</span>
                            </div>
                    `;
            
            if (colStats.unique_values) {
                html += `
                            <div class="stat-item" style="grid-column: span 2; text-align: left;">
                                <span class="label">Sample Values</span>
                                <div style="font-size: 13px; max-height: 100px; overflow-y: auto;">
                                    ${colStats.unique_values.map(v => `<span class="badge bg-secondary me-1 mb-1">${v}</span>`).join('')}
                                </div>
                            </div>
                `;
            }
            
            if (colStats.mean !== undefined) {
                html += `
                            <div class="stat-item">
                                <span class="label">Mean</span>
                                <span class="value">${colStats.mean.toFixed(2)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Median</span>
                                <span class="value">${colStats.median ? colStats.median.toFixed(2) : 'N/A'}</span>
                            </div>
                `;
            }
            
            html += `</div></div></div>`;
        });
        
        html += '</div>';
        $('#countValuesModalBody').html(html);
    }
    
    // ... (rest of the existing functions remain the same)
    
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
        
        fileCount.html(`<small class="text-muted">${files.length} file${files.length > 1 ? 's' : ''} uploaded</small>`);
        
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
                        <button class="btn btn-primary btn-sm load-file-btn" data-filename="${file.filename}" title="Load this file">
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
        showStatus(`Loading ${filename}...`, 'info');
        
        $.ajax({
            url: `/files/${filename}`,
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    populateColumns(response.columns);
                    updateCurrentFileBadge(response.filename);
                    $('#analysisSection').show();
                    $('#emptyState').hide();
                    clearAllAnalyses();
                    showStatus(`File ${filename} loaded!`, 'success');
                    showFileInfoModal(response.file_info);
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
    
    // Highlight loaded file
    function highlightLoadedFile(filename) {
        $('.list-group-item').removeClass('bg-primary bg-opacity-10');
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
                    showStatus(`File ${filename} deleted`, 'success');
                    loadFileList();
                    if ($('#analysisSection').is(':visible')) {
                        $('#analysisSection').hide();
                        $('#emptyState').show();
                        clearAllAnalyses();
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
                <p class="mt-2">Loading...</p>
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
                    $('#fileInfoModalBody').html(`<div class="alert alert-danger">Error loading file info</div>`);
                }
            });
        } else {
            displayFileInfo(filename);
        }
    }
    
    // Display file info
    function displayFileInfo(fileInfo) {
        if (!fileInfo) {
            $('#fileInfoModalBody').html(`<div class="alert alert-warning">No file info available</div>`);
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
                <p class="mt-2">Loading preview...</p>
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
                $('#dataPreviewModalBody').html(`<div class="alert alert-danger">Error loading preview</div>`);
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
                $('#statsModalBody').html(`<div class="alert alert-danger">Error: ${error}</div>`);
            }
        });
    }
    
    // Display statistics
    function displayStatistics(stats) {
        if (!stats || Object.keys(stats).length === 0) {
            $('#statsModalBody').html('<p class="text-muted">No statistics available.</p>');
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
                        <span class="label">Unique</span>
                        <span class="value">${colStats.unique_count}</span>
                    </div>
                    <div class="stat-item" style="grid-column: span 2;">
                        <span class="label">Sample Values</span>
                        <span style="font-size: 12px; word-break: break-all;">${(colStats.unique_values || []).join(', ')}</span>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        });
        
        $('#statsModalBody').html(html);
    }
    
    // Show status message
    function showStatus(message, type) {
        const statusDiv = $('#uploadStatus');
        statusDiv.html(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`);
        
        // Auto-dismiss after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.find('.alert').alert('close');
            }, 5000);
        }
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
    
    // Handle main analysis form - FIXED to use current settings
    $('#analysisForm').on('submit', function(e) {
        e.preventDefault();
        
        // Update current settings
        updateCurrentSettings();
        
        // Validate settings
        if (!currentSettings.xColumns || currentSettings.xColumns.length === 0 || 
            !currentSettings.yColumns || currentSettings.yColumns.length === 0) {
            showStatus('Please select both X and Y axis columns.', 'warning');
            return;
        }
        
        // Check if we can add more analyses
        if (analysisCount >= MAX_ANALYSIS) {
            showStatus(`Maximum ${MAX_ANALYSIS} analyses allowed.`, 'warning');
            return;
        }
        
        // Create new analysis with current settings
        const analysisId = createNewAnalysisItem(currentSettings);
        
        // Auto-generate the analysis
        if (analysisId) {
            setTimeout(() => {
                generateSingleAnalysis(analysisId);
            }, 300);
        }
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
});