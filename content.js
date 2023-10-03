// Log a message to the console
console.log("Hi, I have been injected whoopie!!!");

// Declare variables for recording and storing media chunks
var recorder = null; // MediaRecorder instance
var recordedChunks = []; // Array to store recorded media chunks

// Function to handle the start of screen recording with optional audio
function onAccessApproved(screenStream, includeAudio) {
    // Create a new MediaStream to combine screen and, optionally, microphone audio
    var combinedStream = new MediaStream();
    combinedStream.addTrack(screenStream.getVideoTracks()[0]); // Add screen video track

    if (includeAudio) {
        // If audio is included, request user's microphone audio stream
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (micStream) {
                combinedStream.addTrack(micStream.getAudioTracks()[0]); // Add microphone audio track

                // Initialize the MediaRecorder with the combined stream
                recorder = new MediaRecorder(combinedStream);

                // Event handler for when data is available from the recorder
                recorder.ondataavailable = function (event) {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                }

                // Event handler for when recording stops
                recorder.onstop = function () {
                    // Stop both screen and microphone audio tracks
                    screenStream.getTracks().forEach(function (track) {
                        if (track.readyState === "live") {
                            track.stop();
                        }
                    });
                    micStream.getTracks().forEach(function (track) {
                        if (track.readyState === "live") {
                            track.stop();
                        }
                    });

                    // Generate a custom filename based on the Blob URL
                    var url = URL.createObjectURL(recordedChunks[0]);
                    var lastCharacters = url.substr(-12); // Get the last 12 characters of the URL
                    var customFileName = `untitled_video_${lastCharacters}.mp4`;
                    console.log(customFileName);

                    // Create a Blob with the recorded chunks
                    var blob = new Blob(recordedChunks, { type: 'video/mp4' });

                    // Create a File object with a custom filename
                    var file = new File([blob], customFileName, { type: 'video/mp4' });

                    // Create a FormData object and append the File
                    var formData = new FormData();
                    formData.append('video', file);

                    // Send the FormData to the server
                    sendVideoToServer(formData);

                    recordedChunks = []; // Reset recordedChunks array
                }

                // Start recording
                recorder.start();
            })
            .catch(function (error) {
                console.error('Error accessing microphone:', error);
            });
    } else {
        // If audio is not included, initialize the recorder with the screenStream only
        recorder = new MediaRecorder(screenStream);

        // Event handler for when data is available from the recorder
        recorder.ondataavailable = function (event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        }

        // Event handler for when recording stops
        recorder.onstop = function () {
            // Stop the screen stream only
            screenStream.getTracks().forEach(function (track) {
                if (track.readyState === "live") {
                    track.stop();
                }
            });

            // Generate a custom filename and handle the rest of the code as before
            var url = URL.createObjectURL(recordedChunks[0]);
            var lastCharacters = url.substr(-12);
            var customFileName = `untitled_video_${lastCharacters}.mp4`;
            console.log(customFileName);

            var blob = new Blob(recordedChunks, { type: 'video/mp4' });
            var file = new File([blob], customFileName, { type: 'video/mp4' });

            var formData = new FormData();
            formData.append('video', file);

            // Send the FormData to the server
            sendVideoToServer(formData);

            recordedChunks = []; // Reset recordedChunks array
        }

        // Start recording
        recorder.start();
    }
}

// Function to send the recorded video to the server
function sendVideoToServer(formData) {
    fetch('', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (response.ok) {
                console.log('Video sent to the server successfully.');
                console.log(response.ok);
            } else {
                console.error('Error sending video to the server.');
                console.log(response.ok);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Event listener for messages from a Chrome extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "request_recording") {
        console.log("Requesting recording");

        sendResponse(`processed: ${message.action}`);

        // Request access to screen and optionally microphone audio
        navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: message.screenType,
                mediaSource: "screen"
            },
            audio: message.audio
        }).then((stream) => {
            // Call onAccessApproved with the acquired stream and audio flag
            onAccessApproved(stream, message.audio); // Pass message.audio to include or exclude microphone audio
        })
    }

    if (message.action === "stopvideo") {
        console.log("Stopping video");
        sendResponse(`processed: ${message.action}`);
        
        // Stop the recorder if it exists
        if (!recorder) return console.log("No recorder")
        recorder.stop();
    }
})
