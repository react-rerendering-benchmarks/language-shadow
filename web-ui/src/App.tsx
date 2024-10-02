import { memo } from "react";
import React from 'react';
import './App.css';
import Home from './pages/home';
const App = memo(function App() {
  return <Home />;
});
export default App;