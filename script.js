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
        // Get month as short string (e.g., "Jun")
        const monthShort = now.toLocaleString('en-US', { month: 'short' }); 
        const ampm = hours >= 12 ? 'PM' : 'AM'; 
        const displayHours = hours % 12 || 12; 
        currentTimeSpan.textContent = `${displayHours}:${minutes} ${ampm} | ${monthShort} ${day}`;
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
        let originalWindowRect = {}; 

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
            if (isMaximized) return; 
            isDragging = true;
            offsetX = e.clientX - windowElement.getBoundingClientRect().left;
            offsetY = e.clientY - windowElement.getBoundingClientRect().top;
            windowElement.style.cursor = 'grabbing';
            bringToFront(windowElement); 
        });

        desktop.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            if (newLeft < 0) newLeft = 0;
            if (newLeft + windowElement.offsetWidth > desktop.offsetWidth) {
                newLeft = desktop.offsetWidth - windowElement.offsetWidth;
            }

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
            activeWindows = activeWindows.filter(win => win !== windowElement);
            if (windowElement === terminalWindow) {
                terminalHistory.innerHTML = ''; 
                initializeTerminal(); 
            }
            if (windowElement === projectsWindow) projectsHtmlContent.innerHTML = '';
            if (windowElement === skillsWindow) skillsHtmlContent.innerHTML = '';
            if (windowElement === resumeWindow) resumeIframe.src = 'about:blank';
        });

        minimizeBtn.addEventListener('click', () => {
            windowElement.classList.add('hidden');
        });

        maximizeBtn.addEventListener('click', () => {
            if (!isMaximized) {
                originalWindowRect = {
                    top: windowElement.style.top,
                    left: windowElement.style.left,
                    width: windowElement.style.width,
                    height: windowElement.style.height,
                };
                windowElement.style.top = `${taskbar.offsetHeight}px`;
                windowElement.style.left = '0';
                windowElement.style.width = '100vw';
                windowElement.style.height = `calc(100vh - ${taskbar.offsetHeight}px)`;
                windowElement.style.resize = 'none'; 
                maximizeBtn.innerHTML = '<i class="fas fa-compress-alt"></i>'; 
            } else {
                windowElement.style.top = originalWindowRect.top;
                windowElement.style.left = originalWindowRect.left;
                windowElement.style.width = originalWindowRect.width;
                windowElement.style.height = originalWindowRect.height;
                windowElement.style.resize = 'both'; 
                maximizeBtn.innerHTML = '<i class="fas fa-square"></i>'; 
            }
            isMaximized = !isMaximized;
        });

        if (!windowElement.style.top) windowElement.style.top = '10vh';
        if (!windowElement.style.left) windowElement.style.left = '10vw';
        if (!windowElement.style.width) windowElement.style.width = '70vw';
        if (!windowElement.style.height) windowElement.style.height = '70vh';
    }

    setupWindow(terminalWindow);
    setupWindow(projectsWindow);
    setupWindow(resumeWindow);
    setupWindow(skillsWindow);


    function bringToFront(windowElement) {
        activeWindows = activeWindows.filter(win => win !== windowElement);
        activeWindows.push(windowElement);
        activeWindows.forEach((win, index) => {
            win.style.zIndex = 999 + index; 
        });
    }

    function openSpecificWindow(windowElement, title, contentPath = '') {
        windowElement.classList.remove('hidden'); 
        windowElement.querySelector('.window-title').textContent = title; // Update title here
        bringToFront(windowElement); 

        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn.innerHTML.includes('compress-alt')) {
            maximizeBtn.click(); 
        }

        if (windowElement === terminalWindow) {
            initializeTerminal();
            terminalInput.focus();
        } else if (windowElement === projectsWindow) {
            if (projectsHtmlContent.innerHTML === '' || contentPath !== projectsHtmlContent.dataset.loadedPath) {
                fetch('projects/project.html') 
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
            if (skillsHtmlContent.innerHTML === '' || contentPath !== skillsHtmlContent.dataset.loadedPath) {
                fetch('skills/skill.md') 
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(markdownText => {
                        skillsHtmlContent.innerHTML = marked.parse(markdownText);
                        skillsHtmlContent.dataset.loadedPath = contentPath; 
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
    const customPrompt = '(dipen@kali)~[~]$'; // New custom prompt

    const welcomeMessage = `
┌─(dipen@kali)-[~]
└─$ whoami
dipen
┌─(dipen@kali)-[~]
└─$ cat welcome.txt

  ┌───────────────────────────────────────────────┐
  │         Welcome to Dipen's Portfolio          │
  │            Cybersecurity Specialist           │
  └───────────────────────────────────────────────┘

 <i class="fas fa-lock" style="color: #00ff00;"></i> Current Focus: OSCP Certification Preparation
 <i class="fas fa-user-secret" style="color: #00ff00;"></i> Specializations: Penetration Testing | Ethical Hacking
 <i class="fas fa-heart" style="color: #00ff00;"></i> Passionate about: Red Team Operations | Blue Team Defense

 <i class="fas fa-folder-open" style="color: #00ff00;"></i> Available Files:
  • resume.pdf        - Professional experience & education
  • projects/         - Cybersecurity projects & writeups
  • skills/skill.md   - Technical skills & tools
  • target-oscp.txt   - Certification roadmap

 <i class="fas fa-lightbulb" style="color: #00ff00;"></i> Tip: Double-click any desktop icon to explore!
 Use the menubar at the top for quick access to applications
`;

    function appendToTerminal(text, isCommand = false) {
        const line = document.createElement('div');
        if (isCommand) {
            line.innerHTML = `<span class="prompt">${customPrompt}</span> ${text}`;
        } else {
            line.innerHTML = text; // Use innerHTML to allow for Font Awesome icons in welcome message
        }
        terminalHistory.appendChild(line);
        terminalHistory.scrollTop = terminalHistory.scrollHeight; 
    }

    function handleCommand(command) {
        appendToTerminal(command, true); 

        let output = "";
        const lowerCommand = command.toLowerCase().trim();

        if (lowerCommand === 'ifconfig') {
            output = "Ifconfig? Oh, it's like a secret handshake for network cards. \"Hey, what's your address? And don't forget your mask!\" - *winks in binary*";
        } else if (lowerCommand === 'clear') {
            terminalHistory.innerHTML = ''; 
            return; 
        } else if (lowerCommand === 'help') {
            output = `
Available commands:
  <span style="color: #00ff00;">ifconfig</span>   - Show network interface details
  <span style="color: #00ff00;">clear</span>      - Clear the terminal screen
  <span style="color: #00ff00;">help</span>       - Display this help message
  <span style="color: #00ff00;">ls</span>         - List directory contents
  <span style="color: #00ff00;">pwd</span>        - Print working directory
  <span style="color: #00ff00;">whoami</span>     - Display current username
  <span style="color: #00ff00;">cat &lt;file&gt;</span> - Display file content (e.g., cat skills/skill.md, cat tree.txt, cat welcome.txt)
  <span style="color: #00ff00;">cd &lt;dir&gt;</span>   - Change directory (e.g., cd projects, cd skills, cd resume)`;
        } else if (lowerCommand === 'ls') { 
             output = `home.html  script.js  style.css  Images/  projects/  resume/  skills/  tree.txt`;
        } else if (lowerCommand === 'cd projects') { 
            openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html');
            output = `Opened projects window.`;
        } else if (lowerCommand === 'cd skills') { 
            openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md');
            output = `Opened skills window.`;
        } else if (lowerCommand === 'cd resume') { 
            openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
            output = `Opened resume window.`;
        } else if (lowerCommand.startsWith('cat ')) { 
            const filePath = lowerCommand.substring(4).trim();
            if (filePath === 'skills/skill.md') {
                fetch('skills/skill.md')
                    .then(response => response.text())
                    .then(text => appendToTerminal(text))
                    .catch(error => appendToTerminal(`Error reading file: ${filePath}`));
                return;
            } else if (filePath === 'tree.txt') {
                 fetch('tree.txt')
                    .then(response => response.text())
                    .then(text => {
                        // Replace directory indicators for better terminal display
                        const formattedText = text.replace(/├──/g, '├─').replace(/└──/g, '└─');
                        appendToTerminal(formattedText);
                    })
                    .catch(error => appendToTerminal(`Error reading file: ${filePath}`));
                return;
            } else if (filePath === 'welcome.txt') { // Handle cat welcome.txt
                appendToTerminal(welcomeMessage); // Directly output the welcome message
                return;
            } else {
                output = `cat: ${filePath}: No such file or directory or cannot read this file type.`;
            }
        } else if (lowerCommand === 'pwd') { 
             output = `/`;
        } else if (lowerCommand === 'whoami') { 
            output = `dipen`; // Changed to 'dipen'
        } else {
            output = `Command not found: ${command}<br>Type 'help' to see available commands.`; // Enhanced unknown command message
        }
        appendToTerminal(output);
    }

    function initializeTerminal() {
        terminalHistory.innerHTML = ''; 
        appendToTerminal(welcomeMessage); // Display welcome message initially
        terminalInput.value = ''; 
        terminalInput.focus(); // Ensure input is focused on open
    }

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            const command = terminalInput.value.trim();
            terminalInput.value = ''; 

            if (command) {
                handleCommand(command);
            } else {
                appendToTerminal("", true);
            }
        }
    });

    desktopIcons.querySelectorAll('.icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const action = icon.dataset.action;
            if (action === 'open-terminal') {
                openSpecificWindow(terminalWindow, 'Terminal'); // Changed title here
            } else if (action === 'open-projects') {
                openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html'); 
            } else if (action === 'open-skills') {
                openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md'); 
            } else if (action === 'open-github') {
                window.open('https://github.com/gitdipen', '_blank'); 
            } else if (action === 'open-linkedin') {
                window.open('https://linkedin.com/in/yourprofile', '_blank'); 
            } else if (action === 'open-resume') {
                openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
            }
            kaliMenu.classList.add('hidden'); 
        });
    });

    kaliMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'open-terminal') {
                openSpecificWindow(terminalWindow, 'Terminal'); // Changed title here
            } else if (action === 'open-projects') {
                openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html'); 
            } else if (action === 'open-skills') {
                openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md'); 
            } else if (action === 'open-resume') { 
                openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
            } else if (action === 'open-github') { 
                window.open('https://github.com/gitdipen', '_blank');
            } else if (action === 'open-linkedin') { 
                window.open('https://linkedin.com/in/yourprofile', '_blank');
            }
            kaliMenu.classList.add('hidden'); 
        });
    });

    initializeTerminal();
});