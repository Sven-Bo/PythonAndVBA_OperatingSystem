document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const desktop = document.getElementById('desktop');
    const icons = document.querySelectorAll('.icon');
    const startButton = document.getElementById('startButton');
    const startMenu = document.getElementById('startMenu');
    const contextMenu = document.getElementById('contextMenu');
    const selectionBox = document.getElementById('selectionBox');
    const clock = document.getElementById('clock');

    // Icon elements
    const computerIcon = document.getElementById('computerIcon');
    const documentsIcon = document.getElementById('documentsIcon');
    const internetIcon = document.getElementById('internetIcon');
    const videoIcon = document.getElementById('videoIcon');
    const musicIcon = document.getElementById('musicIcon');

    // Variables for drag functionality
    let selectedIcon = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastClickTime = 0;
    
    // Variables for multi-select
    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    let selectedIcons = [];
    let ctrlKeyPressed = false;
    
    // Music player variables
    let musicPlayerWindow = null;
    let isMusicPlayerOpen = false;
    let tracks = [];
    let currentTrackIndex = -1;

    // Explorer window variables
    let explorerWindow = null;
    let isExplorerOpen = false;

    // Load saved icon positions
    loadIconPositions();

    // Update clock
    updateClock();
    setInterval(updateClock, 60000); // Update every minute

    // Track Ctrl key state
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Control') {
            ctrlKeyPressed = true;
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.key === 'Control') {
            ctrlKeyPressed = false;
        }
    });

    // Desktop click event (deselect all icons when clicking on empty space)
    desktop.addEventListener('mousedown', function(e) {
        // Only proceed if the click was directly on the desktop (not on an icon)
        if (e.target === desktop) {
            // Start selection box
            isSelecting = true;
            selectionStart = { x: e.clientX, y: e.clientY };
            
            // Position and show selection box
            selectionBox.style.left = selectionStart.x + 'px';
            selectionBox.style.top = selectionStart.y + 'px';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.display = 'block';
            
            // Deselect all icons if Ctrl key is not pressed
            if (!ctrlKeyPressed) {
                icons.forEach(icon => icon.classList.remove('selected'));
                selectedIcons = [];
            }
        }
    });

    // Update selection box on mouse move
    desktop.addEventListener('mousemove', function(e) {
        if (isSelecting) {
            // Calculate dimensions
            const width = Math.abs(e.clientX - selectionStart.x);
            const height = Math.abs(e.clientY - selectionStart.y);
            
            // Calculate position (handle selection in any direction)
            const left = Math.min(e.clientX, selectionStart.x);
            const top = Math.min(e.clientY, selectionStart.y);
            
            // Update selection box
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';
            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            
            // Check which icons are within the selection box
            icons.forEach(icon => {
                const iconRect = icon.getBoundingClientRect();
                const selectionRect = selectionBox.getBoundingClientRect();
                
                // Check if icon intersects with selection box
                if (
                    iconRect.left < selectionRect.right &&
                    iconRect.right > selectionRect.left &&
                    iconRect.top < selectionRect.bottom &&
                    iconRect.bottom > selectionRect.top
                ) {
                    icon.classList.add('selected');
                    if (!selectedIcons.includes(icon)) {
                        selectedIcons.push(icon);
                    }
                } else if (!ctrlKeyPressed) {
                    // Only remove selection if Ctrl is not pressed
                    icon.classList.remove('selected');
                    const index = selectedIcons.indexOf(icon);
                    if (index > -1) {
                        selectedIcons.splice(index, 1);
                    }
                }
            });
        }
    });

    // End selection on mouse up
    document.addEventListener('mouseup', function() {
        if (isSelecting) {
            isSelecting = false;
            selectionBox.style.display = 'none';
        }
    });

    // Icon click event (select icon) and double-click event (open link)
    icons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent desktop click event
            
            // Handle selection based on Ctrl key
            if (!ctrlKeyPressed) {
                // Deselect all other icons if Ctrl is not pressed
                icons.forEach(i => {
                    if (i !== this) i.classList.remove('selected');
                });
                selectedIcons = [this];
            } else {
                // Toggle selection when Ctrl is pressed
                if (this.classList.contains('selected')) {
                    this.classList.remove('selected');
                    const index = selectedIcons.indexOf(this);
                    if (index > -1) {
                        selectedIcons.splice(index, 1);
                    }
                } else {
                    selectedIcons.push(this);
                }
            }
            
            // Always select current icon (unless toggled off with Ctrl)
            if (!ctrlKeyPressed || !this.classList.contains('selected')) {
                this.classList.add('selected');
            }
            
            // Check for double click
            const currentTime = new Date().getTime();
            const clickTimeDiff = currentTime - lastClickTime;
            
            if (clickTimeDiff < 300 && !isDragging) { // Double click detected
                // Handle different icons
                if (this.id === 'musicIcon') {
                    openMusicPlayer();
                } else if (this.id === 'computerIcon') {
                    openExplorer();
                } else if (this.id === 'internetIcon') {
                    window.open('https://pythonandvba.com', '_blank');
                } else if (this.id === 'documentsIcon') {
                    window.open('https://www.linkedin.com/in/sven-bosau/', '_blank');
                } else if (this.id === 'videoIcon') {
                    window.open('https://www.youtube.com/c/CodingIsFun', '_blank');
                }
            }
            
            lastClickTime = currentTime;
        });

        // Make icons draggable
        icon.addEventListener('mousedown', function(e) {
            // Prevent default drag behavior
            e.preventDefault();
            e.stopPropagation(); // Prevent desktop mousedown
            
            // Calculate offset
            const rect = this.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            selectedIcon = this;
            isDragging = false;
        });
    });

    // Desktop mouse events for dragging
    desktop.addEventListener('mousemove', function(e) {
        if (selectedIcon) {
            // Start dragging after a small threshold to differentiate from click
            if (!isDragging && 
                (Math.abs(e.clientX - offsetX - selectedIcon.offsetLeft) > 5 || 
                 Math.abs(e.clientY - offsetY - selectedIcon.offsetTop) > 5)) {
                isDragging = true;
            }
            
            if (isDragging) {
                // Calculate new position
                let newX = e.clientX - offsetX;
                let newY = e.clientY - offsetY;
                
                // Keep icon within desktop bounds
                const desktopRect = desktop.getBoundingClientRect();
                const iconRect = selectedIcon.getBoundingClientRect();
                
                // Constrain X position
                if (newX < 0) newX = 0;
                if (newX + iconRect.width > desktopRect.width) {
                    newX = desktopRect.width - iconRect.width;
                }
                
                // Constrain Y position
                if (newY < 0) newY = 0;
                if (newY + iconRect.height > desktopRect.height - 28) { // Account for taskbar
                    newY = desktopRect.height - iconRect.height - 28;
                }
                
                // Update position
                selectedIcon.style.left = newX + 'px';
                selectedIcon.style.top = newY + 'px';
                
                // Save position
                saveIconPositions();
            }
        }
    });

    desktop.addEventListener('mouseup', function() {
        selectedIcon = null;
        isDragging = false;
    });

    // Start button click event
    startButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const startMenu = document.getElementById('startMenu');
        startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
    });

    // Close start menu when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (startMenu.style.display === 'block' && 
            !startMenu.contains(e.target) && 
            e.target !== startButton) {
            startMenu.style.display = 'none';
        }
    });

    // Handle Start Menu item clicks
    document.querySelectorAll('.startMenuItem').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            document.getElementById('startMenu').style.display = 'none';
            
            switch(action) {
                case 'computer':
                    openExplorer();
                    break;
                case 'documents':
                    window.open('https://www.linkedin.com/in/sven-bosau/', '_blank');
                    break;
                case 'internet':
                    window.open('https://pythonandvba.com/', '_blank');
                    break;
                case 'video':
                    window.open('https://www.youtube.com/c/CodingIsFun', '_blank');
                    break;
                case 'music':
                    openMusicPlayer();
                    break;
                case 'shutdown':
                    createShutdownDialog();
                    break;
            }
        });
    });

    // Context menu
    desktop.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        
        // Position the context menu
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.style.display = 'block';
    });

    // Close context menu when clicking elsewhere
    document.addEventListener('click', function() {
        contextMenu.style.display = 'none';
    });

    // Context menu item click events
    document.querySelectorAll('.contextMenuItem').forEach(item => {
        item.addEventListener('click', function() {
            if (this.textContent === 'Properties') {
                alert('Properties dialog would appear here.');
            }
            contextMenu.style.display = 'none';
        });
    });

    // Music player functions
    function openMusicPlayer() {
        if (isMusicPlayerOpen) {
            // Focus the existing window
            musicPlayerWindow.focus();
            return;
        }
        
        // Create music player window
        const playerContainer = document.createElement('div');
        playerContainer.className = 'window music-player-window';
        playerContainer.style.left = '100px';
        playerContainer.style.top = '100px';
        playerContainer.style.zIndex = '600';
        playerContainer.style.width = '400px';
        playerContainer.style.height = '400px';
        
        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        
        const titleText = document.createElement('div');
        titleText.className = 'title-bar-text';
        titleText.textContent = 'Music Player';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-button';
        closeBtn.addEventListener('click', closeMusicPlayer);
        
        titleBar.appendChild(titleText);
        titleBar.appendChild(closeBtn);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'window-content';
        content.style.height = 'calc(100% - 22px)';
        content.style.overflow = 'hidden';
        content.style.backgroundColor = '#c0c0c0';
        
        // Create music player content directly
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; padding: 10px; box-sizing: border-box;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="font-weight: bold; margin-right: 5px;">Now Playing:</div>
                    <div id="trackName" style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">No track selected</div>
                </div>
                
                <div style="flex: 1; display: flex; flex-direction: column; border: 2px solid; border-color: #808080 #fff #fff #808080; background-color: #fff; margin-bottom: 10px;">
                    <div style="background-color: #000080; color: #fff; padding: 2px 5px; font-weight: bold;">Music Tracks</div>
                    <div id="trackList" style="flex: 1; overflow-y: auto; padding: 5px;">
                        <div style="padding: 10px; color: #808080; font-style: italic;">Loading tracks...</div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="text-align: center;">
                        <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
                    </div>
                    
                    <div style="margin: 5px 0;">
                        <div id="progressBar" style="height: 15px; background-color: #fff; border: 2px solid; border-color: #808080 #fff #fff #808080; position: relative; cursor: pointer;">
                            <div id="progress" style="height: 100%; width: 0; background-color: #000080;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: center; gap: 5px;">
                        <button id="prevButton" style="width: 30px; height: 25px; background-color: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">◀◀</button>
                        <button id="playButton" style="width: 30px; height: 25px; background-color: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">▶</button>
                        <button id="pauseButton" style="width: 30px; height: 25px; background-color: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">❚❚</button>
                        <button id="stopButton" style="width: 30px; height: 25px; background-color: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">■</button>
                        <button id="nextButton" style="width: 30px; height: 25px; background-color: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">▶▶</button>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="min-width: 50px;">Volume:</div>
                        <input id="volumeSlider" type="range" min="0" max="100" value="80" style="flex: 1; height: 5px;">
                    </div>
                </div>
            </div>
        `;
        
        // Append audio element
        const audioPlayer = document.createElement('audio');
        audioPlayer.id = 'audioPlayer';
        content.appendChild(audioPlayer);
        
        // Assemble window
        playerContainer.appendChild(titleBar);
        playerContainer.appendChild(content);
        
        // Add to desktop
        document.getElementById('windows').appendChild(playerContainer);
        
        // Make window draggable
        makeMusicPlayerDraggable(playerContainer);
        
        // Store reference to window
        musicPlayerWindow = playerContainer;
        isMusicPlayerOpen = true;
        
        // Initialize music player
        initializeMusicPlayer();
    }
    
    function closeMusicPlayer() {
        if (musicPlayerWindow) {
            document.getElementById('windows').removeChild(musicPlayerWindow);
            musicPlayerWindow = null;
            isMusicPlayerOpen = false;
        }
    }

    function makeMusicPlayerDraggable(playerWindow) {
        const titleBar = playerWindow.querySelector('.title-bar');
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        
        titleBar.addEventListener('mousedown', function(e) {
            isDragging = true;
            
            const rect = playerWindow.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Bring window to front
            playerWindow.style.zIndex = '600';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                playerWindow.style.left = (e.clientX - offsetX) + 'px';
                playerWindow.style.top = (e.clientY - offsetY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }

    function initializeMusicPlayer() {
        // Load tracks from JSON
        fetch('music/tracklist.json')
            .then(response => response.json())
            .then(data => {
                tracks = data;
                displayTracks();
            })
            .catch(error => {
                console.error('Error loading tracks:', error);
            });
            
        // Set up event listeners
        const audioPlayer = document.getElementById('audioPlayer');
        const playButton = document.getElementById('playButton');
        const pauseButton = document.getElementById('pauseButton');
        const stopButton = document.getElementById('stopButton');
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        const volumeSlider = document.getElementById('volumeSlider');
        const progressBar = document.getElementById('progressBar');
        
        playButton.addEventListener('click', playTrack);
        pauseButton.addEventListener('click', pauseTrack);
        stopButton.addEventListener('click', stopTrack);
        prevButton.addEventListener('click', playPreviousTrack);
        nextButton.addEventListener('click', playNextTrack);
        volumeSlider.addEventListener('input', adjustVolume);
        progressBar.addEventListener('click', seekTrack);
        
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', playNextTrack);
        
        // Set initial volume
        audioPlayer.volume = volumeSlider.value / 100;
    }
    
    function displayTracks() {
        const trackList = document.getElementById('trackList');
        trackList.innerHTML = '';
        
        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.textContent = track.name || track.title;
            trackItem.style.padding = '3px 5px';
            trackItem.style.cursor = 'pointer';
            trackItem.style.whiteSpace = 'nowrap';
            trackItem.style.overflow = 'hidden';
            trackItem.style.textOverflow = 'ellipsis';
            
            trackItem.addEventListener('click', () => {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                playTrack();
            });
            
            trackList.appendChild(trackItem);
        });
    }
    
    function loadTrack(index) {
        const audioPlayer = document.getElementById('audioPlayer');
        const trackName = document.getElementById('trackName');
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        
        currentTrackIndex = index;
        const track = tracks[index];
        
        // Update track name
        trackName.textContent = track.name || track.title;
        
        // Set audio source
        audioPlayer.src = 'music/' + track.path;
        
        // Reset progress
        document.getElementById('progress').style.width = '0%';
        currentTime.textContent = '0:00';
        
        // Load audio
        audioPlayer.load();
        
        // Update status when metadata is loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTime.textContent = formatTime(audioPlayer.duration);
        });
        
        // Highlight current track in list
        const trackItems = document.querySelectorAll('.track-item');
        trackItems.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#000080';
                item.style.color = '#fff';
            } else {
                item.style.backgroundColor = '';
                item.style.color = '';
            }
        });
    }
    
    function playTrack() {
        const audioPlayer = document.getElementById('audioPlayer');
        
        if (tracks.length === 0) return;
        
        if (currentTrackIndex === -1) {
            currentTrackIndex = 0;
            loadTrack(currentTrackIndex);
        }
        
        audioPlayer.play();
    }
    
    function pauseTrack() {
        const audioPlayer = document.getElementById('audioPlayer');
        
        if (audioPlayer.paused) return;
        
        audioPlayer.pause();
    }
    
    function stopTrack() {
        const audioPlayer = document.getElementById('audioPlayer');
        
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        document.getElementById('progress').style.width = '0%';
        document.getElementById('currentTime').textContent = '0:00';
    }
    
    function playPreviousTrack() {
        if (tracks.length === 0) return;
        
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        playTrack();
    }
    
    function playNextTrack() {
        if (tracks.length === 0) return;
        
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        playTrack();
    }
    
    function adjustVolume() {
        const audioPlayer = document.getElementById('audioPlayer');
        const volumeSlider = document.getElementById('volumeSlider');
        
        audioPlayer.volume = volumeSlider.value / 100;
    }
    
    function updateProgress() {
        const audioPlayer = document.getElementById('audioPlayer');
        const progress = document.getElementById('progress');
        const currentTime = document.getElementById('currentTime');
        
        if (isNaN(audioPlayer.duration)) return;
        
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = `${percentage}%`;
        
        currentTime.textContent = formatTime(audioPlayer.currentTime);
    }
    
    function seekTrack(e) {
        const audioPlayer = document.getElementById('audioPlayer');
        const progressBar = document.getElementById('progressBar');
        
        if (isNaN(audioPlayer.duration)) return;
        
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        audioPlayer.currentTime = pos * audioPlayer.duration;
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function createShutdownDialog() {
        // Create the shutdown dialog window
        const shutdownWindow = document.createElement('div');
        shutdownWindow.className = 'window';
        shutdownWindow.style.width = '300px';
        shutdownWindow.style.height = '180px';
        shutdownWindow.style.position = 'absolute';
        shutdownWindow.style.left = '50%';
        shutdownWindow.style.top = '50%';
        shutdownWindow.style.transform = 'translate(-50%, -50%)';
        shutdownWindow.style.zIndex = '1000';
        
        // Create the title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        
        const titleText = document.createElement('div');
        titleText.className = 'title-bar-text';
        titleText.textContent = 'Shut Down Computer';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'title-bar-controls';
        closeBtn.innerHTML = `
            <button aria-label="Close" id="closeShutdownBtn"></button>
        `;
        
        titleBar.appendChild(titleText);
        titleBar.appendChild(closeBtn);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'window-content';
        content.style.padding = '15px';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'space-between';
        content.style.height = 'calc(100% - 30px)';
        content.style.boxSizing = 'border-box';
        
        // Add message
        const message = document.createElement('div');
        message.textContent = 'Are you sure you want to shut down your computer?';
        message.style.marginBottom = '20px';
        message.style.textAlign = 'center';
        
        // Add buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginBottom = '10px';
        
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.style.minWidth = '80px';
        yesButton.style.padding = '5px 10px';
        
        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.style.minWidth = '80px';
        noButton.style.padding = '5px 10px';
        
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
        
        // Assemble the window
        content.appendChild(message);
        content.appendChild(buttonContainer);
        shutdownWindow.appendChild(titleBar);
        shutdownWindow.appendChild(content);
        
        // Add to the DOM
        document.getElementById('windows').appendChild(shutdownWindow);
        
        // Add event listeners
        yesButton.addEventListener('click', function() {
            document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #000; color: #fff;"><h1>It is now safe to turn off your computer.</h1></div>';
        });
        
        noButton.addEventListener('click', function() {
            document.getElementById('windows').removeChild(shutdownWindow);
        });
        
        document.getElementById('closeShutdownBtn').addEventListener('click', function() {
            document.getElementById('windows').removeChild(shutdownWindow);
        });
        
        // Make the window draggable
        makeDraggable(shutdownWindow);
    }

    // Explorer window function
    function openExplorer() {
        if (isExplorerOpen) {
            // Focus the existing window
            explorerWindow.focus();
            return;
        }
        
        // Create explorer window
        const explorerContainer = document.createElement('div');
        explorerContainer.className = 'window explorer-window';
        explorerContainer.style.left = '150px';
        explorerContainer.style.top = '100px';
        explorerContainer.style.width = '600px';
        explorerContainer.style.height = '450px';
        explorerContainer.style.zIndex = '600';
        
        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        
        const titleText = document.createElement('div');
        titleText.className = 'title-bar-text';
        titleText.textContent = 'My Computer';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-button';
        closeBtn.addEventListener('click', closeExplorer);
        
        titleBar.appendChild(titleText);
        titleBar.appendChild(closeBtn);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'window-content';
        
        // Create iframe to load the explorer
        const iframe = document.createElement('iframe');
        iframe.src = 'explorer.html';
        iframe.style.width = '100%';
        iframe.style.height = '420px';
        iframe.style.border = 'none';
        
        content.appendChild(iframe);
        
        // Assemble window
        explorerContainer.appendChild(titleBar);
        explorerContainer.appendChild(content);
        
        // Add to desktop
        document.getElementById('windows').appendChild(explorerContainer);
        
        // Make window draggable
        makeWindowDraggable(explorerContainer);
        
        // Store reference to window
        explorerWindow = explorerContainer;
        isExplorerOpen = true;
    }

    function closeExplorer() {
        if (explorerWindow) {
            document.getElementById('windows').removeChild(explorerWindow);
            explorerWindow = null;
            isExplorerOpen = false;
        }
    }

    function makeWindowDraggable(windowElement) {
        const titleBar = windowElement.querySelector('.title-bar');
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        
        titleBar.addEventListener('mousedown', function(e) {
            isDragging = true;
            
            const rect = windowElement.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Bring window to front
            windowElement.style.zIndex = '600';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                windowElement.style.left = (e.clientX - offsetX) + 'px';
                windowElement.style.top = (e.clientY - offsetY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }

    // Toggle start menu
    function toggleStartMenu() {
        if (startMenu.style.display === 'block') {
            startMenu.style.display = 'none';
        } else {
            // Position the menu above the taskbar
            startMenu.style.display = 'block';
        }
    }

    // Functions
    function arrangeIconsGrid() {
        const iconWidth = 80;
        const iconHeight = 90;
        const margin = 10;
        const startX = margin;
        const startY = margin;
        
        icons.forEach((icon, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            
            const x = startX + col * (iconWidth + margin);
            const y = startY + row * (iconHeight + margin);
            
            icon.style.left = x + 'px';
            icon.style.top = y + 'px';
        });
        
        saveIconPositions();
    }

    function saveIconPositions() {
        const positions = {};
        
        icons.forEach(icon => {
            positions[icon.id] = {
                left: icon.style.left,
                top: icon.style.top
            };
        });
        
        localStorage.setItem('iconPositions', JSON.stringify(positions));
    }

    function loadIconPositions() {
        const savedPositions = localStorage.getItem('iconPositions');
        
        if (savedPositions) {
            const positions = JSON.parse(savedPositions);
            
            icons.forEach(icon => {
                if (positions[icon.id]) {
                    icon.style.left = positions[icon.id].left;
                    icon.style.top = positions[icon.id].top;
                }
            });
        } else {
            // Default positions if none saved
            arrangeIconsGrid();
        }
    }

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        clock.textContent = `${hours}:${minutes} ${ampm}`;
    }
});
