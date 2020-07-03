import React from 'react';
import './style.css';
import { IconButton } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';

export default function MessageForm({ sendMsg, changeMsg }) {
  return (
    <form className="message-form" onSubmit={sendMsg}>
      <input
        id="message-form-input"
        placeholder="Send Message"
        inputProps={{ 'aria-label': 'send message' }}
        onChange={(e) => changeMsg(e)}
      />

      <IconButton
        color="primary"
        aria-label="upload picture"
        component="span"
        type="submit"
        value="Submit"
        style={{ padding: '5px', color: '#f2a365' }}
        onClick={(e) => sendMsg(e)}
      >
        <SendIcon />
      </IconButton>
    </form>
  );
}
