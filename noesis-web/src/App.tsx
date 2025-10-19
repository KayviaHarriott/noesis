// import { useState, useEffect } from "react";
import "./App.css";
// import { fetchBackendMessage } from "./api/clientApi";
import { Routes, Route } from "react-router-dom";
import { ClientDashboard } from "./pages/ClientDashboard";
import { AgentDashboard } from "./pages/AgentDashboard";
import { Home } from "./pages/Home";

function App() {
  // const [count, setCount] = useState(0);
  // const [message, setMessage] = useState("Loading...");

  // useEffect(() => {
  //   fetchBackendMessage().then(setMessage);
  // }, []);

  return (
    <>
      <div>
        {/* <h1>{import.meta.env.VITE_APP_NAME}</h1>
        <p>{message}</p> */}

        <Routes>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/" element={<Home />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;
