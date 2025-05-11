import { useCallback, useEffect, useState } from "react";
import Peer from "../server/Peer";
import socket from "../socket";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [fileUrl, setFileUrl] = useState("");
  const [remoteSocketId, setRemoteSocketId] = useState("");

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    socket.emit("upload-files", {
      files: files.map((f) => ({ name: f.name, size: f.size })),
    });

  };

  const handleJoinedFileRoom = useCallback(async (socketId) => {
    setRemoteSocketId(socketId);
    const offer = await Peer.getOffer();
    await Peer.setLocalDescription(new RTCSessionDescription(offer));
    socket.emit("send-offer", { to: socketId, offer });
  }, [socket]);

  useEffect(() => {

    socket.on("uploaded-files", (fileId) => {
      const url = `http://localhost:5173/file/${fileId}`;
      setFileUrl(url);
    });

    const handleRecieveAnswer = async ({ from, answer }) => {
      console.log("Received answer from:", from);
      await Peer.setRemoteDescription(new RTCSessionDescription(answer));
    };

    socket.on("joined-file-room", handleJoinedFileRoom);
    socket.on("recieve-answer", handleRecieveAnswer);

    return () => {
      socket.off("joined-file-room", handleJoinedFileRoom);
      socket.off("recieve-answer", handleRecieveAnswer);
    };
  }, [socket, handleJoinedFileRoom]);

  return (
    <div>
      <h2>Upload Files</h2>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={uploadFiles}>Upload</button>
      {fileUrl && (
        <p>
          Share this link:{" "}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
        </p>
      )}
    </div>
  );
}
