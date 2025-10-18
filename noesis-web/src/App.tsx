import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchBackendMessage } from './api/clientApi'

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
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
