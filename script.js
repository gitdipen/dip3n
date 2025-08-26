document.addEventListener('DOMContentLoaded', () => {

    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar');
    const currentTimeSpan = document.getElementById('current-time');
    const kaliMenuButton = document.getElementById('kali-menu-button');
    const kaliMenu = document.getElementById('kali-menu');
    const desktopIcons = document.getElementById('desktop-icons');
    const loadingScreen = document.getElementById('loading-screen');
    const bootStartTime = new Date();

    const terminalWindow = document.getElementById('terminal-window');
    const projectsWindow = document.getElementById('projects-window');
    const resumeWindow = document.getElementById('resume-window');
    const skillsWindow = document.getElementById('skills-window');

    const terminalHistory = terminalWindow.querySelector('#terminal-history');
    let terminalInput;

    const projectsHtmlContent = document.getElementById('projects-html-content');
    const resumeIframe = document.getElementById('resume-iframe');
    const skillsHtmlContent = document.getElementById('skills-html-content');

    let activeWindows = [];
    let commandHistory = [];
    let historyIndex = -1;

    // --- Loading Screen Logic (Updated) ---
    function startLoadingScreen() {
        // Initially, the desktop is hidden in CSS, but the loading screen is visible
        const bootLog = document.getElementById('boot-log');
        const bootLines = [
            `[ ok ] Setting up network interfaces...`,
            `[ ok ] Starting service Tor...`,
            `[ ok ] Loading kernel modules...`,
            `[ ok ] Mounting filesystems...`, 
            `[ ok ] Boot complete.`,
            `<span class="blinking-cursor">_</span>`
        ];

        let lineIndex = 0;

        function showLine() {
            if (lineIndex < bootLines.length) {
                const lineElement = document.createElement('div');
                lineElement.innerHTML = bootLines[lineIndex];
                bootLog.appendChild(lineElement);
                bootLog.scrollTop = bootLog.scrollHeight;
                lineIndex++;
                setTimeout(showLine, 500);
            } else {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    // The desktop is now revealed by hiding the loading screen
                    initializeDesktop();
                }, 1000);
            }
        }
        showLine();
    }

    // --- Main Desktop Initialization ---
    function initializeDesktop() {
        function updateTime() {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const monthShort = now.toLocaleString('en-US', { month: 'short' });
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            currentTimeSpan.textContent = `${displayHours}:${minutes} ${ampm} | ${monthShort} ${day}`;
        }
        setInterval(updateTime, 1000);
        updateTime();

        kaliMenuButton.addEventListener('click', (event) => {
            kaliMenu.classList.toggle('hidden');
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!kaliMenu.contains(event.target) && !kaliMenuButton.contains(event.target)) {
                kaliMenu.classList.add('hidden');
            }
        });

        function setupWindow(windowElement) {
            let isDragging = false;
            let offsetX, offsetY;
            let isMaximized = false;
            let originalWindowRect = {};

            const header = windowElement.querySelector('.window-header');
            const minimizeBtn = windowElement.querySelector('.minimize-btn');
            const maximizeBtn = windowElement.querySelector('.maximize-btn');
            const closeBtn = windowElement.querySelector('.close-btn');

            windowElement.addEventListener('mousedown', () => {
                bringToFront(windowElement);
            });

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
            windowElement.querySelector('.window-title').textContent = title;
            bringToFront(windowElement);

            const maximizeBtn = windowElement.querySelector('.maximize-btn');
            if (maximizeBtn.innerHTML.includes('compress-alt')) {
                maximizeBtn.click();
            }

            if (windowElement === terminalWindow) {
                initializeTerminal();
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
                const fullPdfPath = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/' + contentPath;
                if (resumeIframe.src !== fullPdfPath) {
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

        const customPrompt = '-(dipen㉿kali)-[~]';
        const welcomeMessage = `
-(dipen㉿kali)-[~] whoami
dipen
-(dipen㉿kali)-[~] cat welcome.txt
───────────────────────────────────────────────────────────
              Welcome to Dipen's Portfolio
                Cybersecurity Professional
───────────────────────────────────────────────────────────
<i class="fas fa-person" style="color: #00a2ff;"></i>   Masters of Cybersecurity (Professional) Student at Deakin University
<i class="fas fa-user-secret" style="color: #00a2ff;"></i>   Experience: Cybersecurity Analyst (3+ years)
<i class="fas fa-project-diagram" style="color: #00a2ff;"></i>   Specializations: Penetration Testing | Ethical Hacking
<i class="fas fa-heart" style="color: #00a2ff;"></i>   Passionate about: Red Team Operations | Blue Team Defense
<i class="fas fa-lock" style="color: #00a2ff;"></i>   Current Focus: Certification Preparation

<i class="fas fa-folder-open" style="color: #00a2ff;"></i>   Available Commands:
    • help         - See a list of all commands
    • whois        - Get my contact information
    • projects     - Open the projects window
    • skills       - Open the skills window
    • resume       - Open my resume
    • ls           - List files/directories
    • uptime       - Check system uptime
─────────────────────────────────────────────────
`;

        function appendToTerminal(text, isCommand = false) {
            const line = document.createElement('div');
            if (isCommand) {
                line.innerHTML = `${customPrompt} ${text}`;
            } else {
                line.innerHTML = text;
            }
            terminalHistory.appendChild(line);
            terminalHistory.scrollTop = terminalHistory.scrollHeight;
        }

        function handleCommand(command) {
            commandHistory.push(command);
            historyIndex = commandHistory.length;

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
  <span style="color: #00a2ff;">ifconfig</span>   - Show network interface details
  <span style="color: #00a2ff;">clear</span>      - Clear the terminal screen
  <span style="color: #00a2ff;">help</span>      - Display this help message
  <span style="color: #00a2ff;">ls</span>         - List directory contents
  <span style="color: #00a2ff;">ls -l</span>      - List directory contents with long format
  <span style="color: #00a2ff;">pwd</span>         - Print working directory
  <span style="color: #00a2ff;">whoami</span>      - Display current username
  <span style="color: #00a2ff;">whois</span>      - Find my contact information
  <span style="color: #00a2ff;">ping</span>       - Test network connectivity
  <span style="color: #00a2ff;">find</span>       - Search for a file
  <span style="color: #00a2ff;">cat &lt;file&gt;</span> - Display file content (e.g., cat skills/skill.md, cat tree.txt, cat welcome.txt)
  <span style="color: #00a2ff;">cd &lt;dir&gt;</span>   - Change directory (e.g., cd projects, cd skills, cd resume)
  <span style="color: #00a2ff;">uptime</span>     - Check how long the system has been running`;
            } else if (lowerCommand === 'ls') {
                output = `index.html   script.js   style.css   images/   projects/   resume/   skills/   tree.txt`;
            } else if (lowerCommand === 'ls -l') {
                 output = `
total 64K
drwxr-xr-x 2 kali kali 4.0K May 25 21:03 Images
-rw-r--r-- 1 kali kali  12K May 25 21:03 index.html
drwxr-xr-x 2 kali kali 4.0K May 25 21:03 projects
drwxr-xr-x 2 kali kali 4.0K May 25 21:03 resume
-rw-r--r-- 1 kali kali 6.8K May 25 21:03 script.js
drwxr-xr-x 2 kali kali 4.0K May 25 21:03 skills
-rw-r--r-- 1 kali kali 3.2K May 25 21:03 style.css
-rw-r--r-- 1 kali kali 0.5K May 25 21:03 tree.txt
-rw-r--r-- 1 kali kali 1.5K May 25 21:03 welcome.txt
-rw-r--r-- 1 kali kali 0.7K May 25 21:03 target.txt
`
            } else if (lowerCommand === 'whois') {
                 output = `
[Querying my portfolio database for contact information...]
- **Email:** thakerdipen05@gmail.com
- **LinkedIn:** https://linkedin.com/in/dipenthaker
- **GitHub:** https://github.com/gitdipen
`
            } else if (lowerCommand === 'ping') {
                 output = `
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=119 time=10.5 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=119 time=10.2 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=119 time=10.9 ms
--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 10.2/10.5/10.9/0.3 ms
`;
            } else if (lowerCommand.startsWith('find ')) {
                const fileName = lowerCommand.substring(5).trim();
                const files = ['project.html', 'skill.md', 'Resume_Dipen_Thaker.pdf', 'kali_linux_wallpaper.jpg', 'tree.txt', 'welcome.txt', 'target.txt'];
                if (files.includes(fileName)) {
                    output = `${fileName} found. Path: /${fileName}`;
                } else if (fileName.includes('/')) {
                    const parts = fileName.split('/');
                    const folder = parts[0];
                    const file = parts[1];
                    if (files.includes(file)) {
                        output = `${file} found. Path: /${folder}/${file}`;
                    } else {
                        output = `find: ‘${fileName}’: No such file or directory`;
                    }
                } else {
                     output = `find: ‘${fileName}’: No such file or directory`;
                }
            } else if (lowerCommand.startsWith('sudo')) {
                 output = "sudo: command not found (You don't have enough privileges... yet!)";
            } else if (lowerCommand === 'uptime') {
                const uptimeMs = new Date() - bootStartTime;
                const hours = Math.floor(uptimeMs / 3600000);
                const minutes = Math.floor((uptimeMs % 3600000) / 60000);
                const seconds = Math.floor((uptimeMs % 60000) / 1000);
                output = `Uptime: ${hours} hours, ${minutes} minutes, ${seconds} seconds.`;
            }
            else if (lowerCommand === 'cd projects' || lowerCommand === 'projects') {
                openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html');
                output = `Opened projects window.`;
            } else if (lowerCommand === 'cd skills' || lowerCommand === 'skills') {
                openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md');
                output = `Opened skills window.`;
            } else if (lowerCommand === 'cd resume' || lowerCommand === 'resume') {
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
                            const formattedText = text.replace(/├──/g, '├─').replace(/└──/g, '└─');
                            appendToTerminal(formattedText);
                        })
                        .catch(error => appendToTerminal(`Error reading file: ${filePath}`));
                    return;
                } else if (filePath === 'welcome.txt') {
                    appendToTerminal(welcomeMessage);
                    return;
                } else if (filePath === 'resume/resume_dipen_thaker.pdf') {
                    output = "cat: Cannot display PDF content directly in terminal. Try opening the resume icon.";
                } else {
                    output = `cat: ${filePath}: No such file or directory or cannot read this file type.`;
                }
            } else if (lowerCommand === 'pwd') {
                output = `/`;
            } else if (lowerCommand === 'whoami') {
                output = `dipen`;
            } else {
                output = `Command not found: ${command}<br>Type 'help' to see available commands.`;
            }
            appendToTerminal(output);
        }

        function initializeTerminal() {
            terminalHistory.innerHTML = '';
            appendToTerminal(welcomeMessage);
            const inputLine = document.createElement('div');
            inputLine.className = 'terminal-input-line';
            inputLine.innerHTML = `<span class="prompt">${customPrompt}</span> <input class="terminal-input" type="text" autofocus>`;
            terminalHistory.appendChild(inputLine);
            terminalInput = inputLine.querySelector('.terminal-input');
            terminalInput.focus();
        }

        terminalWindow.addEventListener('click', () => {
            if (terminalInput) {
                terminalInput.focus();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (document.activeElement === terminalInput) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const command = terminalInput.value.trim();
                    
                    const oldInputLine = terminalInput.parentNode;
                    oldInputLine.innerHTML = `<span class="prompt">${customPrompt}</span> ${command}`;

                    if (command) {
                        handleCommand(command);
                    } else {
                        appendToTerminal("");
                    }
                    
                    const newPromptLine = document.createElement('div');
                    newPromptLine.className = 'terminal-input-line';
                    newPromptLine.innerHTML = `<span class="prompt">${customPrompt}</span> <input class="terminal-input" type="text" autofocus>`;
                    terminalHistory.appendChild(newPromptLine);
                    terminalInput = newPromptLine.querySelector('.terminal-input');
                    terminalInput.focus();
                    terminalHistory.scrollTop = terminalHistory.scrollHeight;

                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        terminalInput.value = commandHistory[historyIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        terminalInput.value = commandHistory[historyIndex];
                    } else if (historyIndex === commandHistory.length - 1) {
                        historyIndex++;
                        terminalInput.value = '';
                    }
                }
            }
        });

        desktopIcons.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const action = icon.dataset.action;
                if (action === 'open-terminal') {
                    openSpecificWindow(terminalWindow, 'Terminal');
                } else if (action === 'open-projects') {
                    openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html');
                } else if (action === 'open-skills') {
                    openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md');
                } else if (action === 'open-github') {
                    window.open('https://github.com/gitdipen', '_blank');
                } else if (action === 'open-linkedin') {
                    window.open('https://linkedin.com/in/dipenthaker', '_blank');
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
                    openSpecificWindow(terminalWindow, 'Terminal');
                } else if (action === 'open-projects') {
                    openSpecificWindow(projectsWindow, 'My Cybersecurity Projects', 'projects/project.html');
                } else if (action === 'open-skills') {
                    openSpecificWindow(skillsWindow, 'Skills - Terminal View', 'skills/skill.md');
                } else if (action === 'open-resume') {
                    openSpecificWindow(resumeWindow, 'Resume - Dipen Thaker', 'resume/Resume_Dipen_Thaker.pdf');
                } else if (action === 'open-github') {
                    window.open('https://github.com/gitdipen', '_blank');
                } else if (action === 'open-linkedin') {
                    window.open('https://linkedin.com/in/dipenthaker', '_blank');
                }
                kaliMenu.classList.add('hidden');
            });
        });
    }
    startLoadingScreen();
});