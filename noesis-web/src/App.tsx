import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchBackendMessage } from './api/clientApi'
import { Routes, Route, Link } from "react-router-dom";
import { ClientDashboard } from './pages/ClientDashboard'
import { AgentDashboard } from './pages/AgentDashboard'

function App() {
  const [count, setCount] = useState(0)
const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetchBackendMessage().then(setMessage);
  }, []);

  return (
    <>
      <div>
        <h1>{import.meta.env.VITE_APP_NAME}</h1>
      <p>{message}</p>


      <Routes>
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/agent" element={<AgentDashboard />} />
         <Route path="/" element={<AgentDashboard />} />
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
  



      </div>
    </>
  )
}

export default App
