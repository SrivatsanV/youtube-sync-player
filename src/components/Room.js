import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const Room = (props) => {
  const socketRef = useRef();
  const peerRef = useRef([]);
  const youtubePlayer = useRef();
  const [videoID, setVideoID] = useState('');

  useEffect(() => {
    socketRef.current = io.connect('http://localhost:8000');
    socketRef.current.emit('join room', props.match.params.roomID);

    socketRef.current.on('create connection', (partnerID) => {
      if (partnerID) {
        console.log('partner' + partnerID);
        let peer = createConnection(partnerID, socketRef.current.id);
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
        incoming.partnerID
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

    //handling closing events
    window.addEventListener('beforeunload', (ev) => {
      ev.preventDefault();
      return (ev.returnValue = socketRef.current.id);
    });
    window.addEventListener('unload', () => {
      peerRef.current.destroy();
      socketRef.current.emit('closing', socketRef.current.id);
    });
  }, []);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = loadVideoPlayer;
  }, []);

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
    //youtubePlayer.current.playVideo();
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
    var msg = { username: socketRef.current.id, data: VID_CUE, video: v_id };
    peerRef.current.map((item) => item.peer.send(JSON.stringify(msg)));
    youtubePlayer.current.loadVideoById(v_id);
  }

  function createConnection(partnerID, callerID) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });
    console.log(peer);
    peer.on('signal', (signal) => {
      const payload = {
        partnerID,
        callerID,
        signal,
      };
      socketRef.current.emit('call partner', payload);
    });

    peer.on('data', handleData);
    peer.on('error', (err) => {
      console.log(err);
    });
    peer.on('close', () => {
      peerRef.current = peerRef.current.filter(
        (item) => item.peer.channelName !== peer.channelName
      );
      console.log(peerRef.current);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, callingID) {
    const peer = new Peer({ initiator: false, trickle: false });

    peer.on('signal', (signal) => {
      const payload = {
        callerID,
        callingID,
        signal,
      };
      socketRef.current.emit('accept call', payload);
    });

    peer.on('data', handleData);
    peer.on('error', (err) => {
      console.log(err);
    });
    peer.on('close', () => {
      console.log('Connection closed');
      peerRef.current = peerRef.current.filter(
        (item) => item.peer.channelName !== peer.channelName
      );
      console.log(peerRef.current);
    });

    peer.signal(incomingSignal);
    return peer;
  }

  function handleData(data) {
    const msg = JSON.parse(data);
    if (msg.username === socketRef.current.id) return; // Ignore what I sent.
    console.log(msg.username + '  ' + socketRef.current.id);
    switch (msg.data) {
      case window.YT.PlayerState.PLAYING:
        console.log('playing');
        youtubePlayer.current.playVideo();
        break;
      case window.YT.PlayerState.PAUSED:
        youtubePlayer.current.pauseVideo();
        break;
      case window.YT.PlayerState.BUFFERING:
        seek = true;
        youtubePlayer.current.seekTo(msg.currentTime, true);
        break;
      case VID_CUE:
        //youtubePlayer.current.cueVideoById(msg.video, 0, 'large');
        youtubePlayer.current.loadVideoById(msg.video);
        break;
    }
  }

  return (
    <>
      <div id="player" />
      <input
        type="text"
        placeholder="video link"
        value={videoID}
        onChange={(e) => setVideoID(e.target.value)}
      />
      <button onClick={loadVideo}>Load video</button>
    </>
  );
};

export default Room;
