import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const Room = (props) => {
  const socketRef = useRef();
  const peerRef = useRef([]);
  const youtubePlayer = useRef();
  const [videoID, setVideoID] = useState('');
  const [initiator, setInitiator] = useState(false);

  useEffect(() => {
    socketRef.current = io.connect('http://localhost:8000');
    socketRef.current.emit('join room', props.match.params.roomID);
    socketRef.current.on('initiator check', (user) => {
      setInitiator(true);
    });

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
        onStateChange: onPlayerStateChange,
      },
    });

    youtubePlayer.current = player;
  }
  function onPlayerStateChange(event) {
    console.log(event);
    console.log(youtubePlayer.current.getCurrentTime());
    if (event.data === -1) youtubePlayer.current.playVideo();
    if (event.data === 1) {
      playVideo();
    } else if (event.data === 2) {
      stopVideo();
    } else if (
      event.data === 3 &&
      youtubePlayer.current.getVideoLoadedFraction() !== 0 &&
      youtubePlayer.current.getCurrentTime() !== 0
    ) {
      console.log('hi1');
      seekToVideo(event);
      //stopVideo();
      youtubePlayer.current.playVideo();
    } else if (
      event.data === 3 &&
      youtubePlayer.current.getCurrentTime() === 0
    ) {
      //seekToVideo(event);
      console.log('3 and 0 s');
      youtubePlayer.current.playVideo();
      playVideo();
    }
    // } else if (
    //   event.data === 3 &&
    //   youtubePlayer.current.getCurrentTime() !== 0 &&
    //   youtubePlayer.current.getVideoLoadedFraction() === 0
    // ) {
    //   console.log('hi2' + youtubePlayer.current.currentTime);
    //   bufferedPause();
    // }
  }
  function stopVideo() {
    peerRef.current.map((item) =>
      item.peer.send(JSON.stringify({ type: 'pause' }))
    );
    youtubePlayer.current.pauseVideo();
  }

  function playVideo() {
    peerRef.current.map((item) =>
      item.peer.send(JSON.stringify({ type: 'play' }))
    );
    youtubePlayer.current.playVideo();
  }
  function seekToVideo(event) {
    peerRef.current.map((item) =>
      item.peer.send(
        JSON.stringify({
          type: 'seek',
          time: event.target.playerInfo.currentTime,
        })
      )
    );
    //youtubePlayer.current.playVideo();
  }

  function loadVideo() {
    peerRef.current.map((item) =>
      item.peer.send(JSON.stringify({ type: 'newVideo', data: videoID }))
    );
    youtubePlayer.current.loadVideoById(videoID.split('=')[1]);
  }

  function createConnection(partnerID, callerID) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });

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
      console.log('Connection closed');
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
    peer.on('close', () => {
      console.log('Connection closed');
    });

    peer.signal(incomingSignal);
    return peer;
  }

  function handleData(data) {
    const parsed = JSON.parse(data);
    if (parsed.type === 'newVideo') {
      youtubePlayer.current.loadVideoById(parsed.data.split('=')[1]);
    } else if (parsed.type === 'pause') {
      youtubePlayer.current.pauseVideo();
    } else if (parsed.type === 'play') {
      youtubePlayer.current.playVideo();
    } else if (parsed.type === 'seek') {
      youtubePlayer.current.seekTo(parsed.time, true);
      //youtubePlayer.current.playVideo();
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
