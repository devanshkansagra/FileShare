import { useCallback, useEffect, useState } from "react";
import socket from "../socket";
import Peer from "../server/Peer";

export default function Download({ fileId }) {
  const [fileList, setFileList] = useState([]);
  const [fileName, setFileName] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");

  const handleUploadFileMetaData = useCallback(({ files }) => {
    if (Array.isArray(files) && files) {
      setFileList(files);
      setFileName(files[0].name);
    }
  },[]);

  const handleRecieveOffer = useCallback(async ({ from, offer }) => {
    try {
      console.log("Recieved offer from: " + from);
      await Peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await Peer.getAnswer(offer);
      await Peer.setLocalDescription(new RTCSessionDescription(answer));
      socket.emit("send-answer", { to: from, answer });

      Peer.peer.ondatachannel = (e) => {
        console.log("Recieved a datachannel");
        const recievedChannel = e.channel
        recievedChannel.onmessage = (e) => {
          console.log(e.data);
        }
      }
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  }, [socket]);

  useEffect(() => {
    socket.emit("join-file-room", fileId);

    socket.on("get-uploaded-file-metadata", handleUploadFileMetaData);

    socket.on("recieve-offer", handleRecieveOffer);

    return () => {
      socket.off("recieve-offer", handleRecieveOffer);
      socket.off("get-uploaded-file-metadata", handleUploadFileMetaData);
    };
  }, [socket,handleRecieveOffer, handleUploadFileMetaData]);

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
