// create a video element inside the video-grid tag
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

// import socket.io client side
const socket = io('/');

// create new peer connection
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3030'
});

// using the peer server to open up a channel and send out current room id and the current user's id to the server.js from client side socket  
peer.on('open', peerId => {
    socket.emit('join-room', ROOM_ID, peerId);
 }); 

// function for adding the media stream to the video element
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    // append video to the video-grid tag
    videoGrid.append(video);
};

// function communicate real time action with new users (userId -> connected user; stream -> my stream)
const connectToNewUser = (userId, stream) => {         
    // call another peer with userId and sent your media stream to the user
    const call = peer.call(userId, stream);          
    // create a video tag for another peer
    const video = document.createElement('video');     
    // listen for the media stream data from the other user and create the user's video element 
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    });
};

// function for scrolling
const scrollToBottom = () => {
    // create a variable to set which div we are going to stay on and in this case its the chat window
    let div = $('main_chat_window');
    // scroll to the current pixel height where the latest sent message at
    div.scrollTop(div.prop("scrollHeight"));
};

// function for mute and unmute
const muteUnmute = () => {
    // check if our stream's audio is on or not
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getAudioTracks()[0].enable = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enable = true;
    }
}

// mute icon change 
const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
    `
    document.querySelector('.main_mute_button').innerHTML = html;
}

// unmute icon change
const setUnmuteButton = () => {
    const html = `
        <i class="unmute fas fa-microphone-slash"></i>
        <span>Unmute</span>
    `
    document.querySelector('.main_mute_button').innerHTML = html; 
}

// function for play stop video
const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

// stop video icon change
const setStopVideo = () => {
    const html = `
        <i class="fas fa-video"></i>
        <span>Stop Video</span>
    `
    document.querySelector('.main_video_button').innerHTML = html;
}

// start video icon change
const setPlayVideo = () => {
    const html = `
        <i class="stop fas fa-video-slash></i>
        <span>Play Video</span>
    `
    document.querySelector('.main_video_button').innerHTLM = html;
}



// obtain access to media data from user hardware --> return a promises
let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
})
.then(stream => {
    // process our video stream on the page
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    
    // wait for current user's stream when its done (since its a promise) and sent it to others
    // listen for the connected user and sent your stream to that user
    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    });
    // if other user calls you 
    peer.on('call' , call => {
        // answer the call and provide our media stream
        call.answer(stream);
        // create video tag
        const video = document.createElement('video');
        // process the stream we received from the peer we answer the call from
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    });
})
.catch(err => {
    console.log(err)
});

// message logic
let msg = $('input')
$('html').keydown((e) => {
    if (e.which == 13 && msg.val().length !== 0) {
        console.log(msg.val());
        socket.emit('message', msg.val());
        msg.val('');
    };
});

// listen for the messages from the server side from different userId and have them show in the chat box
socket.on('createMessage', message => {
    $('.messages').append(
        `<li class="message">
            <b>user</b>
            <br/>
            ${message}
        </li>`
        );
        // we need to make sure that all messages will stay in the messages div
        scrollToBottom();
});





