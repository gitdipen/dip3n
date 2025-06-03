document.addEventListener('DOMContentLoaded', () => {
    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar');
    const currentTimeSpan = document.getElementById('current-time');
    const kaliMenuButton = document.getElementById('kali-menu-button');
    const kaliMenu = document.getElementById('kali-menu');
    const desktopIcons = document.getElementById('desktop-icons');

    // --- References to the specific window elements ---
    const terminalWindow = document.getElementById('terminal-window');
    const projectsWindow = document.getElementById('projects-window');
    const resumeWindow = document.getElementById('resume-window');
    const skillsWindow = document.getElementById('skills-window');

    // --- References to terminal specific elements ---
    const terminalHistory = terminalWindow.querySelector('#terminal-history');
    const terminalInput = terminalWindow.querySelector('.terminal-input');

    // --- References to content divs within their respective windows ---
    const projectsHtmlContent = document.getElementById('projects-html-content');
    const resumeIframe = document.getElementById('resume-iframe');
    const skillsHtmlContent = document.getElementById('skills-html-content');

    // Array to keep track of active windows for z-index management
    let activeWindows = [];

    // --- Taskbar Time ---
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        currentTimeSpan.textContent = `${hours}:${minutes} PM | Jun ${day}`;
    }
    setInterval(updateTime, 1000);
    updateTime(); // Initial call

    // --- Kali Menu Toggle ---
    kaliMenuButton.addEventListener('click', (event) => {
        kaliMenu.classList.toggle('hidden');
        event.stopPropagation();
    });

    // Close Kali Menu if clicked outside
    document.addEventListener('click', (event) => {
        if (!kaliMenu.contains(event.target) && !kaliMenuButton.contains(event.target)) {
            kaliMenu.classList.add('hidden');
        }
    });

    // --- Window Management (Generalized Setup) ---
    function setupWindow(windowElement) {
        let isDragging = false;
        let offsetX, offsetY;
        let isMaximized = false;
        let originalWindowRect = {}; // Stores original position/size before maximize

        const header = windowElement.querySelector('.window-header');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        const closeBtn = windowElement.querySelector('.close-btn');

        // Bring window to front on click (on window body or header)
        windowElement.addEventListener('mousedown', () => {
            bringToFront(windowElement);
        });

        // Dragging
        header.addEventListener('mousedown', (e) => {
            if (isMaximized) return; // Prevent dragging when maximized
            isDragging = true;
            // Calculate offset relative to the window's current position
            offsetX = e.clientX - windowElement.getBoundingClientRect().left;
            offsetY = e.clientY - windowElement.getBoundingClientRect().top;
            windowElement.style.cursor = 'grabbing';
            bringToFront(windowElement); // Bring to front when dragging starts
        });

        desktop.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // Ensure window stays within desktop bounds (optional, but good UX)
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Clamp left position
            if (newLeft < 0) newLeft = 0;
            if (newLeft + windowElement.offsetWidth > desktop.offsetWidth) {
                newLeft = desktop.offsetWidth - windowElement.offsetWidth;
            }

            // Clamp top position (below taskbar)
            if (newTop < taskbar.offsetHeight) newTop = taskbar.offsetHeight;
            if (newTop + windowElement.offsetHeight > desktop.offsetHeight) {
                newTop = desktop.offsetHeight - windowElement.offsetHeight;
            }

            windowElement.style.left = `${newLeft}px`;
            windowElement.style.top = `${newTop}px`;
        });

        desktop.addEventListener('mouseup', () => {
            isDragging = false;
            windowElement.style.cursor = 'grab';
        });

        // Controls
        closeBtn.addEventListener('click', () => {
            windowElement.classList.add('hidden');
            // Remove from activeWindows array
            activeWindows = activeWindows.filter(win => win !== windowElement);
            // Specific clear for terminal
            if (windowElement === terminalWindow) {
                terminalHistory.innerHTML = ''; // Clear terminal history
                initializeTerminal(); // Re-initialize terminal messages
            }
            // Clear content for other windows to ensure fresh load next time
            if (windowElement === projectsWindow) projectsHtmlContent.innerHTML = '';
            if (windowElement === skillsWindow) skillsHtmlContent.innerHTML = '';
            if (windowElement === resumeWindow) resumeIframe.src = 'about:blank';
        });

        minimizeBtn.addEventListener('click', () => {
            windowElement.classList.add('hidden');
            // In a real OS, you'd add it to a taskbar minimized list
        });

        maximizeBtn.addEventListener('click', () => {
            if (!isMaximized) {
                // Save original position and size
                originalWindowRect = {
                    top: windowElement.style.top,
                    left: windowElement.style.left,
                    width: windowElement.style.width,
                    height: windowElement.style.height,
                };
                // Maximize
                windowElement.style.top = `${taskbar.offsetHeight}px`; // Below taskbar
                windowElement.style.left = '0';
                windowElement.style.width = '100vw';
                windowElement.style.height = `calc(100vh - ${taskbar.offsetHeight}px)`;
                windowElement.style.resize = 'none'; // Disable resize when maximized
                maximizeBtn.innerHTML = '<i class="fas fa-compress-alt"></i>'; // Change icon to restore
            } else {
                // Restore
                windowElement.style.top = originalWindowRect.top;
                windowElement.style.left = originalWindowRect.left;
                windowElement.style.width = originalWindowRect.width;
                windowElement.style.height = originalWindowRect.height;
                windowElement.style.resize = 'both'; // Enable resize
                maximizeBtn.innerHTML = '<i class="fas fa-square"></i>'; // Change icon to maximize
            }
            isMaximized = !isMaximized;
        });

        // Set default initial position/size if not already set by CSS
        // This ensures they appear consistently when first opened
        if (!windowElement.style.top) windowElement.style.top = '10vh';
        if (!windowElement.style.left) windowElement.style.left = '10vw';
        if (!windowElement.style.width) windowElement.style.width = '70vw';
        if (!windowElement.style.height) windowElement.style.height = '70vh';
    }

    // Initialize all window elements for dragging and controls
    setupWindow(terminalWindow);
    setupWindow(projectsWindow);
    setupWindow(resumeWindow);
    setupWindow(skillsWindow);


    // Function to bring a window to the front
    function bringToFront(windowElement) {
        // Remove from current position and add to end to ensure highest z-index
        activeWindows = activeWindows.filter(win => win !== windowElement);
        activeWindows.push(windowElement);
        activeWindows.forEach((win, index) => {
            win.style.zIndex = 999 + index; // Assign increasing z-index
        });
    }

    // --- Function to open/show a specific window and load its content ---
    function openSpecificWindow(windowElement, title, contentPath = '') {
        windowElement.classList.remove('hidden'); // Show the window
        windowElement.querySelector('.window-title').textContent = title; // Set its title
        bringToFront(windowElement); // Bring it to the front

        // Reset to non-maximized state when opening new content
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn.innerHTML.includes('compress-alt')) {
            maximizeBtn.click(); // Simulate click to restore
        }

        // Specific content loading logic
        if (windowElement === terminalWindow) {
            initializeTerminal();
            terminalInput.focus();
        } else if (windowElement === projectsWindow) {
            if (projectsHtmlContent.innerHTML === '' || contentPath !== projectsHtmlContent.dataset.loadedPath) {
                fetch(contentPath)
                    .then(response => response.text())
                    .then(html => {
                        projectsHtmlContent.innerHTML = html;
                        projectsHtmlContent.dataset.loadedPath = contentPath;
                    })
                    .catch(error => {
                        projectsHtmlContent.innerHTML = `<p style="color:red;">Error loading content: ${error}</p>`;
                        console.error('Error loading HTML:', error);
                    });
            }
            projectsHtmlContent.scrollTop = 0;
        } else if (windowElement === resumeWindow) {
            if (resumeIframe.src !== window.location.origin + '/' + contentPath) {
                resumeIframe.src = contentPath;
            }
        } else if (windowElement === skillsWindow) {
            // Check if content is already loaded or if the path has changed
            if (skillsHtmlContent.innerHTML === '' || contentPath !== skillsHtmlContent.dataset.loadedPath) {
                fetch(contentPath)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(markdownText => {
                        // Use marked.js to convert Markdown to HTML
                        skillsHtmlContent.innerHTML = marked.parse(markdownText);
                        skillsHtmlContent.dataset.loadedPath = contentPath; // Store loaded path
                    })
                    .catch(error => {
                        skillsHtmlContent.innerHTML = `<p style="color:red;">Error loading content: ${error}. Make sure the Markdown parser library (marked.js) is included.</p>`;
                        console.error('Error loading or parsing Markdown:', error);
                    });
            }
            skillsHtmlContent.scrollTop = 0;
        }
    }


    // --- Terminal Specific Logic ---
    const initialTerminalLines = [
        "H3ll0 W0RLD!!!",
        "Welcome to Dipen's Cybersecurity Portfolio!",
        "Click on the icons or the Kali menu to explore."
    ];

    function appendToTerminal(text, isCommand = false) {
        const line = document.createElement('div');
        if (isCommand) {
            line.innerHTML = `<span class="prompt">kali@kali:~$</span> ${text}`;
        } else {
            line.textContent = text;
        }
        terminalHistory.appendChild(line);
        terminalHistory.scrollTop = terminalHistory.scrollHeight; // Scroll to bottom
    }

    function handleCommand(command) {
        appendToTerminal(command, true); // Show the command typed by user

        let output = "";
        const lowerCommand = command.toLowerCase().trim();

        if (lowerCommand === 'ifconfig') {
            output = "Ifconfig? Oh, it's like a secret handshake for network cards. \"Hey, what's your address? And don't forget your mask!\" - *winks in binary*";
        } else if (lowerCommand === 'clear') {
            terminalHistory.innerHTML = ''; // Clear history
            return; // Don't append empty line
        } else if (lowerCommand === 'help') {
            output = "Available commands: ifconfig, clear, help";
        } else {
            output = `Command not found: ${command}`;
        }
        appendToTerminal(output);
    }

    function initializeTerminal() {
        terminalHistory.innerHTML = ''; // Clear any previous state
        initialTerminalLines.forEach(line => appendToTerminal(line));
        terminalInput.value = ''; // Clear input field
    }

    // Event listener for terminal input
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission/new line
            const command = terminalInput.value.trim();
            terminalInput.value = ''; // Clear input field

            if (command) {
                handleCommand(command);
            } else {
                // If user just presses Enter, just add a new prompt line
                appendToTerminal("", true);
            }
        }
    });

    // --- Event Listeners for Icons and Menu ---
    desktopIcons.querySelectorAll('.icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const action = icon.dataset.action;
            if (action === 'open-terminal') {
                openSpecificWindow(terminalWindow, 'Terminal - Home');
            } else if (action === 'open-projects') {
                openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/index.html');
            } else if (action === 'open-skills') {
                // CORRECTED: Point to README.md as per file structure
                openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/README.md');
            } else if (action === 'open-github') {
                window.open('https://github.com/gitdipen', '_blank'); // Open in new tab
            } else if (action === 'open-linkedin') {
                window.open('https://linkedin.com/in/yourprofile', '_blank'); // Update with your LinkedIn
            } else if (action === 'open-resume') {
                openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
            }
            kaliMenu.classList.add('hidden'); // Close menu after selection
        });
    });

    kaliMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'open-terminal') {
                openSpecificWindow(terminalWindow, 'Terminal - Home');
            } else if (action === 'open-projects') {
                openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/index.html');
            } else if (action === 'open-skills') {
                openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/README.md');
            } else if (action === 'open-resume') { // Added resume to Kali menu as well
                openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
            } else if (action === 'open-github') { // Added github to Kali menu as well
                window.open('https://github.com/gitdipen', '_blank');
            } else if (action === 'open-linkedin') { // Added linkedin to Kali menu as well
                window.open('https://linkedin.com/in/yourprofile', '_blank');
            }
            kaliMenu.classList.add('hidden'); // Close menu after selection
        });
    });

    // Initialize the terminal when the page loads
    initializeTerminal();
});