// Interactive functionality for Redoc documentation

// Initialize Redoc with enhanced configuration
function initializeRedoc() {
    Redoc.init('./openapi.yaml', {
        disableSearch: false,
        expandResponses: "200,201",
        hideDownloadButton: false,
        hideHostname: false,
        hideLoading: false,
        showExtensions: true,
        sortPropsAlphabetically: true,
        theme: {
            colors: {
                primary: { main: '#3b82f6' },
                success: { main: '#10b981' },
                warning: { main: '#f59e0b' },
                error: { main: '#ef4444' }
            },
            sidebar: {
                backgroundColor: '#fafafa'
            },
            rightPanel: {
                backgroundColor: '#263238'
            }
        },
        scrollYOffset: 0,
        pathInMiddlePanel: false,
        requiredPropsFirst: true
    }, document.getElementById('redoc-container'));
    
    // Add interactive elements after Redoc loads
    setTimeout(function() {
        addInteractiveElements();
    }, 3000);
}

function addInteractiveElements() {
    console.log('Adding interactive elements...');
    
    // Add "Test this endpoint" buttons to operations
    const operations = document.querySelectorAll('h2[data-section-id*="operation/"], h3[data-section-id*="operation/"]');
    operations.forEach(function(header) {
        if (!header.querySelector('.try-it-btn')) {
            const btn = document.createElement('button');
            btn.className = 'try-it-btn';
            btn.textContent = 'Test Endpoint';
            btn.onclick = function() {
                const operationId = header.getAttribute('data-section-id');
                openTestWindow(operationId);
            };
            header.appendChild(btn);
        }
    });
    
    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach(function(block) {
        if (!block.querySelector('.copy-btn') && block.textContent.trim()) {
            block.style.position = 'relative';
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.onclick = function(e) {
                e.stopPropagation();
                navigator.clipboard.writeText(block.textContent);
                btn.textContent = 'Copied!';
                setTimeout(function() {
                    btn.textContent = 'Copy';
                }, 1000);
            };
            block.appendChild(btn);
        }
    });
    
    console.log('Interactive elements added successfully!');
}

function openTestWindow(operationId) {
    const path = operationId ? operationId.replace('operation/', '') : '';
    const testWindow = window.open('', '_blank', 'width=900,height=700');
    
    const testWindowContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test API Endpoint</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; }
                .form-group { margin: 15px 0; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                button { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px 10px 0; }
                button:hover { background: #2563eb; }
                .response { margin-top: 20px; padding: 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; }
                .response pre { background: #ffffff; padding: 10px; border-radius: 3px; overflow: auto; }
            </style>
        </head>
        <body>
            <h2>Test API Endpoint</h2>
            <p><strong>Endpoint:</strong> ${path}</p>
            <form id="testForm">
                <div class="form-group">
                    <label>Method:</label>
                    <select id="method">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>URL:</label>
                    <input type="text" id="url" value="http://localhost:3000${path.startsWith('/') ? path : '/' + path}" />
                </div>
                <div class="form-group">
                    <label>Authorization Token (Optional):</label>
                    <input type="text" id="token" placeholder="Bearer token for authenticated endpoints" />
                </div>
                <div class="form-group">
                    <label>Request Body (JSON for POST/PUT):</label>
                    <textarea id="body" rows="8" placeholder="{}"></textarea>
                </div>
                <button type="submit">Send Request</button>
                <button type="button" onclick="window.close()">Close</button>
            </form>
            <div id="response" class="response" style="display:none;">
                <h3>Response:</h3>
                <pre id="responseBody"></pre>
            </div>
            <script>
                document.getElementById("testForm").onsubmit = async function(e) {
                    e.preventDefault();
                    const method = document.getElementById("method").value;
                    const url = document.getElementById("url").value;
                    const token = document.getElementById("token").value;
                    const body = document.getElementById("body").value;
                    const headers = {"Content-Type": "application/json"};
                    if (token) headers["Authorization"] = "Bearer " + token;
                    try {
                        const options = {method: method, headers: headers};
                        if (method !== "GET" && body.trim()) options.body = body;
                        const response = await fetch(url, options);
                        const responseText = await response.text();
                        document.getElementById("response").style.display = "block";
                        document.getElementById("responseBody").textContent = "Status: " + response.status + " " + response.statusText + "\\n\\n" + responseText;
                    } catch (error) {
                        document.getElementById("response").style.display = "block";
                        document.getElementById("responseBody").textContent = "Error: " + error.message;
                    }
                };
            </script>
        </body>
        </html>
    `;
    
    testWindow.document.write(testWindowContent);
    testWindow.document.close();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeRedoc();
});
