import React from 'react';
import { v1 } from 'uuid';

export default function CreateRooms(props) {
  function create() {
    const id = v1();
    props.history.push(`/room/${id}`);
  }

  return (
    <>
      <h2>Youtube Sync Master</h2>
      <button onClick={create}>Create room</button>
    </>
  );
}
