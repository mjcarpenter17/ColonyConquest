/**
 * Debug Console for Colony Conquest
 */

const DebugConsole = (function() {
    let _enabled = false;
    let _container = null;
    let _log = [];
    const _maxLogSize = 50;
    
    /**
     * Initialize the debug console
     * @param {boolean} enabled - Whether the console is enabled
     */
    function initialize(enabled) {
        _enabled = enabled;
        
        if (_enabled) {
            createConsoleUI();
            overrideConsole();
        }
    }
    
    /**
     * Create the console UI
     */
    function createConsoleUI() {
        _container = document.createElement('div');
        _container.className = 'debug-console';
        _container.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            width: 400px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            overflow-y: auto;
            z-index: 10000;
            border-top-left-radius: 5px;
        `;
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'X';
        toggleButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 5px;
            cursor: pointer;
        `;
        toggleButton.addEventListener('click', function() {
            _container.style.display = _container.style.display === 'none' ? 'block' : 'none';
        });
        
        _container.appendChild(toggleButton);
        document.body.appendChild(_container);
    }
    
    /**
     * Override console methods
     */
    function overrideConsole() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        console.log = function(...args) {
            originalConsole.log.apply(console, args);
            appendToDebugLog('LOG', args);
        };
        
        console.error = function(...args) {
            originalConsole.error.apply(console, args);
            appendToDebugLog('ERROR', args);
        };
        
        console.warn = function(...args) {
            originalConsole.warn.apply(console, args);
            appendToDebugLog('WARN', args);
        };
        
        console.info = function(...args) {
            originalConsole.info.apply(console, args);
            appendToDebugLog('INFO', args);
        };
    }
    
    /**
     * Append message to debug log
     * @param {string} level - Log level
     * @param {array} args - Arguments
     */
    function appendToDebugLog(level, args) {
        if (!_enabled || !_container) return;
        
        // Convert arguments to string
        let message = '';
        for (const arg of args) {
            if (typeof arg === 'object') {
                try {
                    message += JSON.stringify(arg) + ' ';
                } catch (e) {
                    message += '[Object] ';
                }
            } else {
                message += arg + ' ';
            }
        }
        
        // Add to log
        _log.push({ level, message, time: new Date() });
        
        // Truncate log if too large
        if (_log.length > _maxLogSize) {
            _log.shift();
        }
        
        // Update UI
        updateConsoleUI();
    }
    
    /**
     * Update the console UI
     */
    function updateConsoleUI() {
        if (!_container) return;
        
        // Clear existing content
        while (_container.childElementCount > 1) {
            _container.removeChild(_container.lastChild);
        }
        
        // Add log entries
        _log.forEach(entry => {
            const entryElement = document.createElement('div');
            
            // Format time
            const time = entry.time.toTimeString().split(' ')[0];
            
            // Set color based on level
            let color = '#fff';
            switch (entry.level) {
                case 'ERROR':
                    color = '#f44336';
                    break;
                case 'WARN':
                    color = '#ff9800';
                    break;
                case 'INFO':
                    color = '#2196f3';
                    break;
            }
            
            entryElement.innerHTML = `<span style="color: #aaa;">[${time}]</span> <span style="color: ${color};">${entry.level}:</span> ${entry.message}`;
            _container.appendChild(entryElement);
        });
        
        // Scroll to bottom
        _container.scrollTop = _container.scrollHeight;
    }
    
    /**
     * Log a message directly to the debug console
     * @param {string} message - Message to log
     */
    function log(message) {
        console.log(message);
    }
    
    /**
     * Log an error directly to the debug console
     * @param {string} message - Message to log
     */
    function error(message) {
        console.error(message);
    }
    
    // Public API
    return {
        initialize,
        log,
        error
    };
})();
