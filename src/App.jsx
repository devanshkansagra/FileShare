import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Upload from "./Upload";
import Download from "./Download";
import { Routes, Route, useParams } from "react-router-dom";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/file/:fileId" element={<DownloadWrapper />} />
      </Routes>
    </>
  );
}

function DownloadWrapper() {
  const { fileId } = useParams(); // Extracts `fileId` from URL
  return <Download fileId={fileId} />;
}

export default App;
