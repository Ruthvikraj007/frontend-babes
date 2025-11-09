# Video Call Interface Creator
$htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Call</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #121212;
            color: #ffffff;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: #1a1a1a;
            border-bottom: 1px solid #333;
        }
        
        .contact-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #555;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .contact-name {
            font-weight: 500;
        }
        
        .call-duration {
            font-size: 14px;
            color: #aaa;
        }
        
        .call-controls {
            display: flex;
            gap: 15px;
        }
        
        .control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .end-call {
            background-color: #ff3b30;
        }
        
        .video-container {
            flex: 1;
            display: flex;
            position: relative;
            overflow: hidden;
        }
        
        .remote-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .local-video {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 120px;
            height: 160px;
            border-radius: 10px;
            border: 2px solid #333;
            object-fit: cover;
            background-color: #2a2a2a;
        }
        
        .footer {
            padding: 15px 20px;
            background-color: #1a1a1a;
            border-top: 1px solid #333;
            display: flex;
            justify-content: center;
        }
        
        .footer-controls {
            display: flex;
            gap: 20px;
        }
        
        .footer-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 10px;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #333;
        }
        
        .active {
            background-color: #007aff;
        }
        
        .status-bar {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background-color: #000;
            font-size: 12px;
        }
        
        .network-status {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .signal-indicator {
            width: 15px;
            height: 10px;
            display: flex;
            align-items: flex-end;
        }
        
        .signal-bar {
            width: 3px;
            margin-right: 1px;
            background-color: #4cd964;
        }
        
        .bar-1 { height: 3px; }
        .bar-2 { height: 5px; }
        .bar-3 { height: 7px; }
        .bar-4 { height: 9px; }
    </style>
</head>
<body>
    <div class="status-bar">
        <div>21:34</div>
        <div class="network-status">
            <div class="signal-indicator">
                <div class="signal-bar bar-1"></div>
                <div class="signal-bar bar-2"></div>
                <div class="signal-bar bar-3"></div>
                <div class="signal-bar bar-4"></div>
            </div>
            <div>Wi-Fi</div>
        </div>
    </div>
    
    <div class="header">
        <div class="contact-info">
            <div class="avatar">Y</div>
            <div>
                <div class="contact-name">yoyo</div>
                <div class="call-duration">00:05:23</div>
            </div>
        </div>
        <div class="call-controls">
            <button class="control-btn">🔊</button>
            <button class="control-btn end-call">📞</button>
        </div>
    </div>
    
    <div class="video-container">
        <video class="remote-video" autoplay muted></video>
        <video class="local-video" autoplay muted></video>
    </div>
    
    <div class="footer">
        <div class="footer-controls">
            <button class="footer-btn">🎤</button>
            <button class="footer-btn">📹</button>
            <button class="footer-btn">🔄</button>
            <button class="footer-btn">💬</button>
            <button class="footer-btn">⋯</button>
        </div>
    </div>
    
    <script>
        // Simulate video elements (in a real app these would be actual video streams)
        document.addEventListener('DOMContentLoaded', function() {
            // Update call duration every second
            let seconds = 323; // Starting at 5:23
            const durationElement = document.querySelector('.call-duration');
            
            setInterval(function() {
                seconds++;
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                durationElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            }, 1000);
            
            // Add click handlers for control buttons
            const controlButtons = document.querySelectorAll('.footer-btn');
            controlButtons.forEach(button => {
                button.addEventListener('click', function() {
                    this.classList.toggle('active');
                });
            });
            
            // End call button handler
            document.querySelector('.end-call').addEventListener('click', function() {
                if(confirm('End this call?')) {
                    // In a real app, this would end the call
                    alert('Call ended');
                }
            });
        });
    </script>
</body>
</html>
"@

# Save the HTML content to a file
$htmlContent | Out-File -FilePath "video_call.html" -Encoding UTF8

# Open the HTML file in the default browser
Start-Process "video_call.html"

Write-Host "Video call interface created and opened in your browser."
