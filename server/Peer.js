class PeerConnection {
  dataChannel;

  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      // await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      return offer;
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      // await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      // await this.peer.setLocalDescription(new RTCSessionDescription(answer));
      return answer;
    }
  }

  async setLocalDescription(desc) {
    await this.peer.setLocalDescription(desc);
  }

  async setRemoteDescription(desc) {
    await this.peer.setRemoteDescription(desc);
  }

  createDataChannel(label = "fileTransfer") {
    if (!this.dataChannel) {
      this.dataChannel = this.peer.createDataChannel(label);
      return this.dataChannel;
    }
  }
}

export default new PeerConnection();
