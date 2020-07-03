import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Container, Grid, Box, Button } from '@material-ui/core';
import PublishIcon from '@material-ui/icons/Publish';
import Messages from '../Messages/Messages';
import MessageForm from '../MessageForm/MessageForm';

import { createConnection, addPeer } from '../utils/webRTC';

import './style.css';

const Room = (props) => {
  const socketRef = useRef();
  const peerRef = useRef([]);
  const youtubePlayer = useRef();
  const [videoID, setVideoID] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [username, setUsername] = useState({ socRef: '', user: '' });
  const [error, setError] = useState(false);
  const [message, setMessage] = useState({
    data: 7,
    username: '',
    msg: '',
  });
  const [messages, setMessages] = useState([]);
  const msgsRef = useRef([]);

  useEffect(() => {
    socketRef.current = io.connect('http://localhost:8000');
    if (!showForm) {
      socketRef.current.emit('join room', {
        roomID: props.match.params.roomID,
        name: username.user,
      });
      setUsername({ ...username, socRef: socketRef.current.id });
      socketRef.current.on('create connection', (partnerID) => {
        if (partnerID) {
          console.log('partner' + partnerID);
          let peer = createConnection(
            partnerID,
            socketRef.current.id,
            handleData,
            socketRef,
            peerRef
          );
          peerRef.current.push({
            peerID: partnerID,
            peer: peer,
          });
          console.log(peerRef.current);
        }
      });

      socketRef.current.on('caller signal', (incoming) => {
        let peer = addPeer(
          incoming.signal,
          incoming.callerID,
          incoming.partnerID,
          handleData,
          socketRef,
          peerRef
        );
        peerRef.current.push({
          peerID: incoming.callerID,
          peer: peer,
        });
        console.log(peerRef.current);
      });

      socketRef.current.on('callee signal', (incoming) => {
        console.log(incoming.callingID);
        let peer = peerRef.current.find(
          (item) => item.peerID === incoming.callingID
        );
        console.log(peer);
        peer.peer.signal(incoming.signal);
      });

      socketRef.current.on('room full', () => {
        alert('room is full');
      });
    }
    //handling closing events
    const closinghandler = () => {
      socketRef.current.emit('closing', {
        id: socketRef.current.id,
        roomID: props.match.params.roomID,
      });
      peerRef.current.destroy();
    };
    window.addEventListener('beforeunload', (ev) => {
      ev.preventDefault();
      ev.returnValue = 'Want to leave?';
    });
    window.onunload = closinghandler;
  }, [showForm]);

  useEffect(() => {
    if (!showForm) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = loadVideoPlayer;
    }
  }, [showForm]);

  function loadVideoPlayer() {
    const player = new window.YT.Player('player', {
      height: '390',
      width: '640',
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    youtubePlayer.current = player;
  }
  function onPlayerReady(event) {
    console.log('HI');
    setShowPlayer(true);
  }
  var seek = false;
  const VID_CUE = 6; //video cue
  function onPlayerStateChange(event) {
    console.log(event);
    var msg = {
      username: socketRef.current.id,
      data: event.data,
      currentTime: youtubePlayer.current.getCurrentTime(),
    };
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        peerRef.current.map((item) => item.peer.send(JSON.stringify(msg)));
        break;
      case window.YT.PlayerState.PAUSED:
        peerRef.current.map((item) => item.peer.send(JSON.stringify(msg)));
        break;
      case window.YT.PlayerState.BUFFERING:
        if (seek) seek = false;
        else peerRef.current.map((item) => item.peer.send(JSON.stringify(msg)));
        break;
      case -1:
        youtubePlayer.current.playVideo();
    }
  }

  function loadVideo() {
    var v_id = videoID.split('=')[1];
    setVideoID('');
    var msg = { username: socketRef.current.id, data: VID_CUE, video: v_id };
    peerRef.current.map((item) => item.peer.send(JSON.stringify(msg)));
    youtubePlayer.current.loadVideoById(v_id);
  }

  function handleData(data) {
    const msg = JSON.parse(data);
    if (msg.username === socketRef.current.id) return; // Ignore what I sent.
    msgsRef.current.push(msg);
    switch (msg.data) {
      case window.YT.PlayerState.PLAYING:
        youtubePlayer.current.playVideo();
        break;
      case window.YT.PlayerState.PAUSED:
        youtubePlayer.current.pauseVideo();
        break;
      case window.YT.PlayerState.BUFFERING:
        //seek = true;
        youtubePlayer.current.seekTo(msg.currentTime, true);
        break;
      case VID_CUE:
        //youtubePlayer.current.cueVideoById(msg.video, 0, 'large');
        youtubePlayer.current.loadVideoById(msg.video);
        break;
      case 7:
        const msgs = msgsRef.current;
        setMessages([...msgs]);
        break;
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    e.target.reset();
    //check for uniqueness in username
    if (username.user.match('^[A-Za-z0-9]+$')) {
      socketRef.current.emit('check user', {
        roomID: props.match.params.roomID,
        name: username.user,
      });
      socketRef.current.on('check user result', (present) => {
        if (!present) {
          setShowForm(false);
        } else {
          setError(true);
        }
      });
    } else {
      setError(true);
    }
  };

  const sendMsg = (e) => {
    e.preventDefault();
    setMessages([...messages, message]);
    msgsRef.current.push(message);
    peerRef.current.map((item) => item.peer.send(JSON.stringify(message)));
    e.target.reset();
  };
  const changeMsg = (e) => {
    setMessage({
      data: 7,
      msg: e.target.value,
      username: username.user,
    });
  };

  if (showForm) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        style={{
          height: '100vh',
        }}
      >
        <div>
          <h1 style={{ marginTop: '-100px' }}>
            Welcome to Youtube sync player
          </h1>
          <form onSubmit={handleSubmit} style={{}}>
            <label id="label-name">Name:</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username.user}
              onChange={(e) =>
                setUsername({ ...username, user: e.target.value })
              }
              id="input-username"
            />

            <input id="submit-button" type="submit" value="Submit" />
            {error ? (
              <p style={{ color: '#ffbd69' }}>Re-enter name</p>
            ) : (
              <p style={{ color: '#222831' }}>Nothing</p>
            )}
          </form>
        </div>
      </Box>
    );
  } else {
    return (
      <Container>
        <h1>Youtube sync</h1>
        <Grid item xs={12} container justify="center">
          <div style={{ margin: '20px', overflow: 'hidden' }}>
            <div
              id="player"
              style={{ height: '390px', width: '640px', display: 'block' }}
            >
              {showPlayer ? (
                <></>
              ) : (
                <div style={{ paddingTop: '185px', textAlign: 'center' }}>
                  <div className="player-preloader"></div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '30px' }}>
              <input
                id="input-video-link"
                type="text"
                placeholder="video link"
                value={videoID}
                onChange={(e) => setVideoID(e.target.value)}
              />
              <Button
                variant="contained"
                id="button-video"
                startIcon={<PublishIcon />}
                onClick={loadVideo}
              >
                Load
              </Button>
            </div>
          </div>
          <div
            style={{
              margin: '20px',
              borderRadius: '20px',
              // perspective: '1px',
              overflow: 'hidden',
            }}
          >
            <div style={{ borderRadius: '20px' }}>
              <Messages messages={messages} />

              <MessageForm sendMsg={sendMsg} changeMsg={changeMsg} />
            </div>
          </div>
        </Grid>
      </Container>
    );
  }
};

export default Room;
