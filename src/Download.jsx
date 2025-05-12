import { useCallback, useEffect, useState, useRef } from "react";
import socket from "../socket";
import Peer from "../server/Peer";

export default function Download({ fileId }) {
  const [fileList, setFileList] = useState([]);
  const [fileName, setFileName] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const receivedChunks = [];
  let receivedBytes = 0;
  let totalSize = 0;

  const filesRef = useRef([]);
  useEffect(() => {
    filesRef.current = fileList;
  }, [fileList]);
  const handleUploadFileMetaData = useCallback(({ files }) => {
    if (Array.isArray(files) && files) {
      setFileList(files);
    }
  }, []);

  const handleRecieveOffer = useCallback(
    async ({ from, offer }) => {
      try {
        console.log("Recieved offer from: " + from);
        await Peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await Peer.getAnswer(offer);
        await Peer.setLocalDescription(new RTCSessionDescription(answer));
        socket.emit("send-answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    },
    [socket],
  );

  useEffect(() => {
    socket.emit("join-file-room", fileId);

    socket.on("get-uploaded-file-metadata", handleUploadFileMetaData);

    socket.on("recieve-offer", handleRecieveOffer);

    Peer.peer.ondatachannel = (e) => {
      console.log("Recieved a datachannel");
      const recievedChannel = e.channel;
      recievedChannel.onmessage = (e) => {
        if (typeof e.data === "string") {
          const message = JSON.parse(e.data);

          if (message.type === "EOF") {
            console.log("Transfer complete. Creating file...");
            const blob = new Blob(receivedChunks, {
              type: "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filesRef.current[0].name;
            a.click();
            URL.revokeObjectURL(url);
            return;
          }
        }
        receivedChunks.push(e.data);
        receivedBytes += e.data.byteLength;
      };
    };

    return () => {
      socket.off("recieve-offer", handleRecieveOffer);
      socket.off("get-uploaded-file-metadata", handleUploadFileMetaData);
    };
  }, [socket, handleRecieveOffer, handleUploadFileMetaData]);

  return (
    <div>
      <h2>Files Available</h2>
      <ul>
        {fileList.map((file, idx) => (
          <li key={idx}>
            {file.name} ({file.size} bytes)
          </li>
        ))}
      </ul>
      <p>{downloadStatus}</p>
    </div>
  );
}
