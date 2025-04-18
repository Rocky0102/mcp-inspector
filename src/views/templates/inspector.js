const vscode = acquireVsCodeApi();
let isConnected = false;

function handleTransportChange() {
    const transportType = document.getElementById('transportType').value;
    document.getElementById('stdioSection').classList.toggle('active', transportType === 'stdio');
    document.getElementById('sseSection').classList.toggle('active', transportType === 'sse');
}

function connect() {
    if (isConnected) {
        disconnect();
        return;
    }

    const transportType = document.getElementById('transportType').value;
    let connectionData = {};

    if (transportType === 'stdio') {
        const command = document.getElementById('command').value;
        const args = document.getElementById('scriptArgs').value;
        connectionData = {
            transport: 'stdio',
            command: command,
            args: args
        };
    } else {
        connectionData = {
            transport: 'sse',
            serverUrl: document.getElementById('serverUrl').value
        };
    }

    // Send connection data to extension
    vscode.postMessage({
        command: 'connect',
        data: connectionData
    });
}

function disconnect() {
    vscode.postMessage({
        command: 'disconnect'
    });
}

function updateConnectionUI(connected) {
    const statusIndicator = document.getElementById('statusIndicator');
    const connectButtonText = document.getElementById('connectButtonText');
    const status = document.getElementById('status');
    const toolsContainer = document.getElementById('toolsContainer');

    isConnected = connected;

    if (connected) {
        statusIndicator.className = 'status-indicator status-connected';
        connectButtonText.textContent = 'Disconnect';
        status.textContent = 'Connected';
        toolsContainer.classList.add('visible');
    } else {
        statusIndicator.className = 'status-indicator status-disconnected';
        connectButtonText.textContent = 'Connect';
        status.textContent = 'Disconnected';
        toolsContainer.classList.remove('visible');
    }
}

function displayTools(tools) {
    const toolsList = document.getElementById('toolsList');
    toolsList.innerHTML = tools.map(tool => {
        const schemaString = encodeURIComponent(JSON.stringify({
            properties: tool.input_schema?.properties || {},
            required: tool.input_schema?.required || []
        }));

        // Generate parameter details HTML
        const paramDetails = Object.entries(tool.input_schema?.properties || {}).map(([paramName, paramInfo]) => {
            return `
                <div class="param-details">
                    <p><strong>${paramName}</strong> (${paramInfo.type || 'unknown'})
                    <div>${paramInfo.description || ''}</div></p>
                </div>
            `;
        }).join('');

        return `
            <div class="tool-container">
                <div class="tool-item">
                    <strong>${tool.name}</strong>
                    <div class="param-container">
                        ${paramDetails}
                    </div>
                </div>
                <button class="tool-button" onclick="showToolModal('${tool.name}', '${schemaString}')">RUN</button>
            </div>
        `;
    }).join('');
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'connectionStatus':
            if (message.data.disconnected) {
                updateConnectionUI(false);
            } else if (message.data.success) {
                updateConnectionUI(true);
                if (message.data.tools) {
                    displayTools(message.data.tools);
                }
            } else {
                updateConnectionUI(false);
                document.getElementById('status').textContent = 'Connection failed: ' + message.data.error;
            }
            break;
        case 'loadConnectionData':
            // Pre-fill form with connection data
            const connection = message.data;
            document.getElementById('transportType').value = connection.transport;
            handleTransportChange();
            
            if (connection.transport === 'stdio') {
                document.getElementById('command').value = connection.command || '';
                document.getElementById('scriptArgs').value = connection.args || '';
            } else if (connection.transport === 'sse') {
                document.getElementById('serverUrl').value = connection.serverUrl || '';
            }
            break;
        case 'autoConnect':
            // Automatically trigger the connect button if not already connected
            if (!isConnected) {
                connect();
            }
            break;
        case 'toolExecutionResponse':
            const responseViewer = document.getElementById('responseViewer');
            const responseContent = document.getElementById('responseContent');
            responseViewer.style.display = 'block';
            responseContent.textContent = JSON.stringify(message.data, null, 2);
            break;
    }
});

function showToolModal(toolName, schemaString) {
    const modal = document.getElementById('toolModal');
    const modalTitle = document.getElementById('modalTitle');
    const toolFields = document.getElementById('toolFields');
    const responseViewer = document.getElementById('responseViewer');
    const responseContent = document.getElementById('responseContent');

    // Reset the form and response viewer
    toolFields.innerHTML = '';
    responseViewer.style.display = 'none';
    responseContent.textContent = '';

    // Parse the schema
    const schema = JSON.parse(decodeURIComponent(schemaString));
    modalTitle.textContent = `Execute ${toolName}`;

    // Create form fields based on schema
    Object.entries(schema.properties).forEach(([key, value]) => {
        const isRequired = schema.required.includes(key);
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'form-group';

        const label = document.createElement('label');
        label.htmlFor = key;
        label.innerHTML = `${key}${isRequired ? ' <span class="required-field">*</span>' : ''}`;
        
        const input = document.createElement('textarea');
        input.rows = 2;
        input.id = key;
        input.name = key;
        input.required = isRequired;

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        toolFields.appendChild(fieldContainer);
    });

    // Handle form submission
    const form = document.getElementById('toolForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const args = {};
        formData.forEach((value, key) => {
            if (value) args[key] = value;
        });

        vscode.postMessage({
            command: 'executeTool',
            data: {
                toolName: toolName,
                args: args
            }
        });
    };

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('toolModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('toolModal');
    if (event.target === modal) {
        closeModal();
    }
}
