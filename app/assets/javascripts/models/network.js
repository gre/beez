
// idea of Backbone.Model:
// HivePeer
// BeePeer
// events: connect / disconnect
// methods: send(jsobject)
// event: "data", {jsobject} // when receiving data

function trace(text) {
    console.log(((new Date()).getTime() / 1000) + ": " + text);
}

function logError(error) {
  console.log("Error: " + error.name + ": " + error.message);
}

beez.Peer = Backbone.Model.extend({
    initialize: function() {
        this.on("message", this.onmessage);
        this.localPeerConnection = null;
        this.createConnection(this.isinitiator);
    },
    createConnection: function(isinitiator) {
      var servers = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
      this.localPeerConnection = new webkitRTCPeerConnection(servers,{optional: [{RtpDataChannels: true}]});
      trace('Created local peer connection object localPeerConnection');

      this.localPeerConnection.onicecandidate = this.gotLocalCandidate;

      if (isinitiator) {
        try {
          // Reliable Data Channels not yet supported in Chrome
          sendChannel = this.localPeerConnection.createDataChannel("sendDataChannel",{reliable: false});
          trace('Created send data channel');
        } catch (e) {
          alert('Failed to create data channel. ' +
                'You need Chrome M25 or later with RtpDataChannel enabled');
          trace('createDataChannel() failed with exception: ' + e.message);
        }

        sendChannel.onopen = this.handleSendChannelStateChange;
        sendChannel.onclose = this.handleSendChannelStateChange;
        sendChannel.onmessage = this.handleMessage;

        this.localPeerConnection.createOffer(this.gotLocalDescription);
      } else {
          this.localPeerConnection.ondatachannel = this.gotReceiveChannel;
      }
    },
    onmessage: function(json) {
        var data = json.data;

        if (data.sdp) {
            trace("onmessage: Session description received, set it: " + JSON.stringify(data.sdp));
            this.localPeerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
                    trace("onmessage: setRemoteDescription callback: " + this.localPeerConnection.remoteDescription.type);
                    // if we received an offer, we need to answer
                    if (this.localPeerConnection.remoteDescription.type == "offer") {
                        trace("Create answer");
                        this.localPeerConnection.createAnswer(onLocalDescriptionGenerated, logError);
                    }
                }, logError);
        } else if (data.candidate) {
            trace("onmessage: New candidate: " + JSON.stringify(data.candidate));
            this.localPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
            logError("Unknow data" + data);
        }
    },
    signalingChannelSend: function(data) {
        if (this.isinitiator) {
            this.hivebroker.wssend(this.id, data);
        } else {
            this.beepeerbroker.wssend(this.id, data);
        }
    },
    // Send stuff
    gotLocalDescription: function (desc) {
      trace("gotLocalDescription");
      this.localPeerConnection.setLocalDescription(desc, function() {
        signalingChannel.send(JSON.stringify({ "sdp": this.localPeerConnection.localDescription }));
      }, logError);
      trace('Offer from localPeerConnection \n' + desc.sdp);
    },

    gotLocalCandidate: function (event) {
      trace('gotLocalCandidate local ice callback');
      if (event.candidate) {
        trace('Local ICE candidate: \n' + event.candidate.candidate);
        signalingChannel.send(JSON.stringify({ "candidate": event.candidate }));
      }
    },

    handleMessage: function (event) {
      trace('Received message: ' + event.data);
    },

    handleSendChannelStateChange: function () {
      var readyState = sendChannel.readyState;
      trace('Send channel state is: ' + readyState);
    },
    // For not initiator only
    gotReceiveChannel: function (event) {
        trace('Receive Channel Callback, OK');
        sendChannel = event.channel;
        sendChannel.onmessage = handleMessage;
        sendChannel.onopen = handleSendChannelStateChange;
        sendChannel.onclose = handleSendChannelStateChange;
    },
    onLocalDescriptionGenerated: function (desc) {
        this.localPeerConnection.setLocalDescription(desc, function() {
            signalingChannel.send(JSON.stringify({ "sdp": this.localPeerConnection.localDescription }));
        }, logError);
    }

});

beez.HiveBroker = Backbone.Model.extend({
    initialize: function () {
        this.peers = new Backbone.Collection();
        this.ws.onmessage(this.onmessage);
    },
    // json: { client_id: 123, data: {} }
    onmessage: function(json) {
        var peer = this.peers.get(json.client_id);

        if (peer) {
            peer.trigger("message", json.data);
        } else {
            this.peers.add(new beez.Peer({id: id, hivebroker: this, isinitiator: false}));

        }
    },
    wssend: function(client_id, json) {
        this.ws.send(JSON.stringify( {"to": client_id, "data": data} ));
    }
});

beez.BeePeerBroker = Backbone.Model.extend({
    initialize: function () {
        this.ws.onmessage(this.onmessage);
        this.peer = new beez.Peer({id: id, beepeerbroker: this, isinitiator: true});
    },
    onmessage: function(json) {
        peer.trigger("message", json.data);
    },
    wssend: function(json) {
        this.ws.send(JSON.stringify( {"to": "123456789", "data": data} ));
    }

});