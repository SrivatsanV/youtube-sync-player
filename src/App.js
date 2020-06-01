import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateRooms from './components/CreateRooms';
import Room from './components/Room';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRooms} />
          <Route path="/room/:roomID" component={Room} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
