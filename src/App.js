import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import Amplify from '@aws-amplify/core';
import API, { graphqlOperation } from '@aws-amplify/api';
import '@aws-amplify/pubsub';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'

import { createMessage } from './graphql/mutations';
import { onCreateMessage } from './graphql/subscriptions';
import { messagesByChannelId } from './graphql/queries';

import awsExports from './aws-exports';
import './App.css';

Amplify.configure(awsExports);

function App() {
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');

  useEffect(() => {
    API
      .graphql(graphqlOperation(messagesByChannelId, {
        channelID: '1',
        sortDirection: 'ASC'
      }))
      .then((response) => {
        const items = response?.data?.messagesByChannelID?.items;

        if (items) {
          setMessages(items);
        }
      })
  }, []);

  useEffect(() => {
    const subscription = API
      .graphql(graphqlOperation(onCreateMessage))
      .subscribe({
        next: (event) => {
          setMessages([...messages, event.value.data.onCreateMessage]);
        }
      });

    return () => {
      <div className="App">
        <header>
          <img src={logo} className="App-logo" alt="logo" />
          <h1>We now have Auth!</h1>
        </header>
        <AmplifySignOut />
      </div>
      subscription.unsubscribe();
    }
  }, [messages]);

  const handleChange = (event) => {
    setMessageBody(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const input = {
      channelID: '1',
      author: 'Dave',
      body: messageBody.trim()
    };

    try {
      setMessageBody('');
      await API.graphql(graphqlOperation(createMessage, { input }))
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <div className="container">
      <div className="messages">
        <div className="messages-scroller">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.author === 'Dave' ? 'message me' : 'message'}>{message.body}</div>
          ))}
        </div>
      </div>
      <div className="chat-bar">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="message"
            placeholder="Type your message here..."
            onChange={handleChange}
            value={messageBody} />
        </form>
      </div>
    </div>
  );
}

export default withAuthenticator(App);