import React, { useEffect, useRef } from 'react';
import { Container } from '@material-ui/core';
import './style.css';

export default function Messages({ messages }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
    //messagesEndRef.current.scrollIntoViewIfNeeded();
  };
  return (
    <Container
      maxWidth="sm"
      style={{
        backgroundColor: '#ececec',
        height: '500px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'flex-start',
      }}
      id="chatbox"
    >
      <div className="message-container">
        {messages.map((item) => (
          <div className="message">
            <p className="username">
              <b>{item.username}</b>
            </p>

            <p className="msg-body">{item.msg}</p>
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </Container>
  );
}
