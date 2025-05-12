import { useCallback, useEffect, useState, useRef } from "react";
import Peer from "../server/Peer";
import socket from "../socket";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [fileUrl, setFileUrl] = useState("");
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [answer, setAnswer] = useState(null);

  const url = `${import.meta.env.VITE_HOST}:${
    import.meta.env.VITE_CLIENT_PORT
  }`;
  const filesRef = useRef([]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    socket.emit("upload-files", {
      files: files.map((f) => ({ name: f.name, size: f.size })),
    });
  };

  const datachannel = Peer.createDataChannel();
  const handleJoinedFileRoom = useCallback(
    async (socketId) => {
      setRemoteSocketId(socketId);
      const offer = await Peer.getOffer();
      await Peer.setLocalDescription(new RTCSessionDescription(offer));

      socket.emit("send-offer", { to: socketId, offer });
    },
    [socket],
  );

  useEffect(() => {
    const handleRecieveAnswer = async ({ from, answer }) => {
      console.log("Received answer from:", from);
      await Peer.setRemoteDescription(new RTCSessionDescription(answer));
      setAnswer(answer);
    };
    if (datachannel) {
      datachannel.onopen = () => {
        if (filesRef.current && Array.isArray(filesRef.current)) {
          const file = filesRef.current;
          const chunkSize = 50 * 1024; // 16KB per chunk
          let offset = 0;

          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target.readyState !== FileReader.DONE) return;

            datachannel.send(e.target.result);
            offset += e.target.result.byteLength;

            if (offset < file[0].size) {
              readSlice(offset);
            } else {
              console.log("✅ File transfer complete");
              datachannel.send(JSON.stringify({ type: "EOF" })); // Signal end of file
            }
          };
          const readSlice = (o) => {
            const slice = file[0].slice(o, o + chunkSize);
            reader.readAsArrayBuffer(slice);
          };

          readSlice(0);
        }
      };
    }

    socket.on("uploaded-files", (fileId) => {
      setFileUrl(`${url}/file/${fileId}`);
    });

    socket.on("joined-file-room", handleJoinedFileRoom);
    socket.on("recieve-answer", handleRecieveAnswer);

    return () => {
      socket.off("joined-file-room", handleJoinedFileRoom);
      socket.off("recieve-answer", handleRecieveAnswer);
    };
  }, [socket, handleJoinedFileRoom, files, datachannel]);

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
