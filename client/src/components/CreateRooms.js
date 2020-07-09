import React from 'react';
import { v1 } from 'uuid';
import { Box } from '@material-ui/core';

export default function CreateRooms(props) {
  function create() {
    const id = v1();
    props.history.push(`/room/${id}`);
  }

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
        <h1 id="title">Youtube Sync Player</h1>
        <button onClick={create} id="create-button">
          Create room
        </button>
      </div>
    </Box>
  );
}
