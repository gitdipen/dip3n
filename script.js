document.addEventListener('DOMContentLoaded', () => {
    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar');
    const kaliMenuBtn = document.getElementById('kali-menu-btn');
    const kaliMenu = document.getElementById('kali-menu');
    const contentWindow = document.getElementById('content-window');
    const windowHeader = contentWindow.querySelector('.window-header');
    const windowTitle = contentWindow.querySelector('.window-title');
    const closeBtn = contentWindow.querySelector('.close-btn');
    const minimizeBtn = contentWindow.querySelector('.minimize-btn');
    const maximizeBtn = contentWindow.querySelector('.maximize-btn');
    const currentClock = document.getElementById('current-time');
    const desktopIcons = document.getElementById('desktop-icons');

    // Content display elements
    const contentIframe = document.getElementById('content-iframe');
    const htmlContentDiv = document.getElementById('html-content');
    const terminalOutputPre = document.getElementById('terminal-output');

    let isDragging = false;
    let offsetX, offsetY;
    let isMaximized = false;
    let originalWindowPos = { top: 0, left: 0, width: 0, height: 0 };

    // --- Taskbar Clock ---
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
        currentClock.textContent = `${time} | ${date}`;
    }
    setInterval(updateClock, 1000);
    updateClock(); // Initial call

    // --- Kali Menu Toggle ---
    kaliMenuBtn.addEventListener('click', (event) => {
        kaliMenu.classList.toggle('hidden');
        event.stopPropagation(); // Prevent document click from immediately closing
    });

    // Close Kali menu if clicked outside
    document.addEventListener('click', (event) => {
        if (!kaliMenu.contains(event.target) && !kaliMenuBtn.contains(event.target)) {
            kaliMenu.classList.add('hidden');
        }
    });

    // --- Window Dragging ---
    windowHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - contentWindow.getBoundingClientRect().left;
        offsetY = e.clientY - contentWindow.getBoundingClientRect().top;
        windowHeader.style.cursor = 'grabbing';
    });

    desktop.addEventListener('mousemove', (e) => {
        if (!isDragging || isMaximized) return; // Cannot drag if maximized
        contentWindow.style.left = (e.clientX - offsetX) + 'px';
        contentWindow.style.top = (e.clientY - offsetY) + 'px';
    });

    desktop.addEventListener('mouseup', () => {
        isDragging = false;
        windowHeader.style.cursor = 'grab';
    });

    // --- Window Controls ---
    closeBtn.addEventListener('click', () => {
        contentWindow.classList.add('hidden');
        // Reset content display for next open
        hideAllContentDivs();
    });

    minimizeBtn.addEventListener('click', () => {
        // Simple minimize: just hide for now. Could be more complex.
        contentWindow.classList.add('hidden');
    });

    maximizeBtn.addEventListener('click', () => {
        if (isMaximized) {
            // Restore
            contentWindow.style.top = originalWindowPos.top;
            contentWindow.style.left = originalWindowPos.left;
            contentWindow.style.width = originalWindowPos.width;
            contentWindow.style.height = originalWindowPos.height;
            isMaximized = false;
        } else {
            // Maximize
            originalWindowPos = {
                top: contentWindow.style.top,
                left: contentWindow.style.left,
                width: contentWindow.style.width,
                height: contentWindow.style.height
            };
            contentWindow.style.top = taskbar.offsetHeight + 'px'; // Below taskbar
            contentWindow.style.left = '0px';
            contentWindow.style.width = '100%';
            contentWindow.style.height = `calc(100vh - ${taskbar.offsetHeight}px)`;
            isMaximized = true;
        }
    });

    // --- Content Loading Logic (CORE CHANGES HERE) ---

    // Helper to hide all content display elements
    function hideAllContentDivs() {
        contentIframe.style.display = 'none';
        htmlContentDiv.style.display = 'none';
        terminalOutputPre.style.display = 'none';
        contentIframe.src = ''; // Clear iframe source
        htmlContentDiv.innerHTML = ''; // Clear HTML content
        terminalOutputPre.textContent = ''; // Clear terminal content
    }

    // Function to load content into the window
    async function loadContent(type, path = '', title = 'Window') {
        contentWindow.classList.remove('hidden'); // Show the window
        windowTitle.textContent = title; // Set window title
        hideAllContentDivs(); // Hide all previous content

        if (type === 'terminal') {
            terminalOutputPre.style.display = 'block';
            terminalOutputPre.textContent = `kali@kali:~$ Welcome to Dipen's Cybersecurity Portfolio!
kali@kali:~$ Click on the icons or the Kali menu to explore.
kali@kali:~$
`;
        } else if (type === 'resume') {
            contentIframe.style.display = 'block';
            contentIframe.src = path; // Load PDF directly into iframe
        } else if (type === 'html') {
            htmlContentDiv.style.display = 'block';
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const html = await response.text();
                htmlContentDiv.innerHTML = html;
            } catch (error) {
                htmlContentDiv.innerHTML = `<p style="color: red;">Error loading content: ${error.message}</p><p>Please ensure the file '${path}' exists and is accessible.</p>`;
                console.error("Error loading HTML content:", error);
            }
        } else if (type === 'markdown-to-terminal') {
            terminalOutputPre.style.display = 'block';
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const markdownText = await response.text();
                // Simple way to display markdown as terminal text
                // Removes bolding and extra spaces for a cleaner look, but preserves lines
                const cleanText = markdownText
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
                    .replace(/__(.*?)__/g, '$1')    // Remove __bold__
                    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Convert [link](url) to link (url)
                    .replace(/^- /, '  - ') // Basic list indent
                    .replace(/^#+ /, '') // Remove markdown headings
                    .trim(); // Trim whitespace

                terminalOutputPre.textContent = `kali@kali:~$ cat ${path.split('/').pop()}\n\n${cleanText}\nkali@kali:~$ `;

            } catch (error) {
                terminalOutputPre.textContent = `kali@kali:~$ Error: Could not load skills data.\nkali@kali:~$ ${error.message}\nkali@kali:~$ `;
                console.error("Error loading markdown for terminal:", error);
            }
        }
    }

    // --- Icon Click Handlers & Menu Item Handlers ---

    // Desktop Icon Clicks
    document.getElementById('resume-icon').addEventListener('click', () => loadContent('resume', 'resume/Resume_Dipen_Thaker.pdf', 'Resume - Dipen Thaker')); // FIX: Corrected PDF filename
    document.getElementById('projects-icon').addEventListener('click', () => loadContent('html', 'projects/index.html', 'My Cybersecurity Projects')); // Now loads the main projects listing page
    document.getElementById('skills-icon').addEventListener('click', () => loadContent('markdown-to-terminal', 'skills/README.md', 'Skills - Terminal View')); // Now loads skills as terminal output
    document.getElementById('github-icon').addEventListener('click', () => window.open('https://github.com/gitdipen', '_blank')); // Opens in new tab as it's external
    document.getElementById('linkedin-icon').addEventListener('click', () => window.open('https://www.linkedin.com/in/dipenthaker', '_blank')); // Opens in new tab as it's external
    document.getElementById('terminal-icon').addEventListener('click', () => loadContent('terminal', '', 'Terminal - Home'));


    // Kali Menu Item Clicks
    kaliMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', (event) => {
            kaliMenu.classList.add('hidden'); // Close menu
            const action = item.dataset.action;
            switch (action) {
                case 'open-resume': loadContent('resume', 'resume/Resume_Dipen_Thaker.pdf', 'Resume - Dipen Thaker'); break; // FIX: Corrected PDF filename
                case 'open-projects': loadContent('html', 'projects/index.html', 'My Cybersecurity Projects'); break; // Now loads the main projects listing page
                case 'open-skills': loadContent('markdown-to-terminal', 'skills/README.md', 'Skills - Terminal View'); break; // Now loads skills as terminal output
                case 'open-github': window.open('https://github.com/gitdipen', '_blank'); break; // Opens in new tab
                case 'open-linkedin': window.open('https://www.linkedin.com/in/dipenthaker', '_blank'); break; // Opens in new tab
                case 'open-terminal': loadContent('terminal', '', 'Terminal - Home'); break;
            }
        });
    });

    // Initially show the terminal window
    loadContent('terminal', '', 'Terminal - Home');
});