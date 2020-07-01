import Peer from 'simple-peer';

export function createConnection(
  partnerID,
  callerID,
  handleData,
  socketRef,
  peerRef
) {
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

export function addPeer(
  incomingSignal,
  callerID,
  callingID,
  handleData,
  socketRef,
  peerRef
) {
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
