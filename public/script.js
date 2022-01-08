const socket = io('/');

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

var myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
}); 

let myVideoStream 
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        })
    })

    socket.on('user-connected', (userId) => {
        connecToNewUser(userId, stream);
    })

    // obtaining DOM elements from the NicknameForm Interface
    const $nickForm = $("#nickForm");
    const $nickError = $("#nickError");
    const $nickname = $("#nickname");

    $nickForm.submit((e) => {
        e.preventDefault();

        socket.emit("new-user", $nickname.val().trim(), (data) => {
            if (data.ok) {
                $("#nickWrap").hide();
                // $('#contentWrap').show();
                socket.nickname = $nickname.val();
                document.querySelector("#contentWrap").style.display = "flex";
                //$("#message").focus();
            } else {
                if (data.msg == "Username cannot be empty."){
                    $nickError.html(`
                        <div class="alert alert-danger">
                            ${data.msg}
                        </div>
                    `);
                } else {
                    $nickError.html(`
                        <div class="alert alert-danger">
                            ${data.msg}
                        </div>
                    `);
                }
            }
        });
        $nickname.val("");
    });

    // input value
    let text = $('#chat_message');
    // when press enter send message
    $('html').keydown((e) => {
        if (e.which == 13 && text.val().length !== 0) {
            socket.emit('message', text.val());
            text.val('');
        }
    });

    socket.on('createMessage', data => {
        $('ul').append(`<li class="message"><b>${data.nick}</b><br/>${data.msg}</li>`);
        scrollToBottom();
    })
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    // client-side socket
    socket.emit('join-room', ROOM_ID, id);
})

const connecToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    })

    call.on('close', () => {
        video.remove()
    })
    
    peers[userId] = call;
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}

// Mute our video stream
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `
        <i class="fas fa-microphone"></i>
        <span>Mute</span>
    `

    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
        <i class="unmute fas fa-microphone-slash"></i>
        <span>Unmute</span>
    `

    document.querySelector('.main__mute_button').innerHTML = html;
}

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setStopVideo = () => {
    const html = `
        <i class="fas fa-video"></i>
        <span>Stop Video</span>
    `

    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
        <i class="stop fas fa-video-slash"></i>
        <span>Play Video</span>
    `

    document.querySelector('.main__video_button').innerHTML = html;
}
