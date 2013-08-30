
// idea of Backbone.Model:
// HivePeer
// BeePeer
// events: connect / disconnect
// methods: send(jsobject)
// event: "data", {jsobject} // when receiving data

function trace(text) {
    //console.log(((new Date()).getTime() / 1000) + ": " + text);
}

function logError(error) {
  console.log("Error: " + error.name + ": " + error.message);
}

beez.Peer = Backbone.Model.extend({
    initialize: function(options) {
        this.hivebroker = options.hivebroker;
        this.beepeerbroker = options.beepeerbroker;
        this.isinitiator = options.isinitiator;
        this.on("message", this.onmessage, this);
        this.localPeerConnection = null;
        this.createConnection(this.isinitiator);
        //this.sendChannel = null;
    },
    createConnection: function(isinitiator) {
      var servers = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
      this.localPeerConnection = new webkitRTCPeerConnection(servers,{optional: [{RtpDataChannels: true}]});
      trace('Created local peer connection object localPeerConnection');

      this.localPeerConnection.onicecandidate = _.bind(this.gotLocalCandidate, this);
      //alert("createConnection")
      if (isinitiator) {
        try {
          // Reliable Data Channels not yet supported in Chrome
            this.sendChannel = this.localPeerConnection.createDataChannel("sendDataChannel",{reliable: false});
          trace('Created send data channel');
        } catch (e) {
          alert('Failed to create data channel. ' +
                'You need Chrome M25 or later with RtpDataChannel enabled');
          trace('createDataChannel() failed with exception: ' + e.message);
        }

        this.sendChannel.onopen = _.bind(this.handleSendChannelStateChange, this);
        this.sendChannel.onclose = _.bind(this.handleSendChannelStateChange, this);
        this.sendChannel.onmessage = _.bind(this.handleMessage, this);

        this.localPeerConnection.createOffer(_.bind(this.gotLocalDescription, this));
      } else {
          this.localPeerConnection.ondatachannel = _.bind(this.gotReceiveChannel, this);
      }
    },
    onmessage: function(json) {
        var data = JSON.parse(json);
        var self = this;
        if (data.sdp) {
            trace("onmessage: Session description received, set it: " + JSON.stringify(data.sdp));
            this.localPeerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {

                    trace("onmessage: setRemoteDescription callback: " + self.localPeerConnection.remoteDescription.type);
                    // if we received an offer, we need to answer
                    if (self.localPeerConnection.remoteDescription.type == "offer") {
                        trace("Create answer");
                        self.localPeerConnection.createAnswer(_.bind(self.onLocalDescriptionGenerated, self), logError);
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
            this.beepeerbroker.wssend(this.id, data);
        } else {
            this.hivebroker.wssend(this.id, data);
        }
    },
    // Send stuff
    gotLocalDescription: function (desc) {
      var self = this;
      //console.log("gotLocalDescription",this)
      this.localPeerConnection.setLocalDescription(desc, function() {
        self.signalingChannelSend(JSON.stringify({ "sdp": self.localPeerConnection.localDescription }));
      }, logError);
      trace('Offer from localPeerConnection \n' + desc.sdp);
    },

    gotLocalCandidate: function (event) {
      trace('gotLocalCandidate local ice callback');
      if (event.candidate) {
        trace('Local ICE candidate: \n' + event.candidate.candidate);
        this.signalingChannelSend(JSON.stringify({ "candidate": event.candidate }));
      }
    },

    handleMessage: function (event) {
      trace('Received message: ' + event.data);
      if (this.hivebroker)
        this.hivebroker.onrtcmessage(event.data);
    },

    handleSendChannelStateChange: function () {
      var readyState = this.sendChannel.readyState;
      if (readyState == "open") {
        console.log("webrtc connection establshed!");
      }
      trace('Send channel state is: ' + readyState);
    },
    // For not initiator only
    gotReceiveChannel: function (event) {
        trace('Receive Channel Callback, OK');
        this.sendChannel = event.channel;
        this.sendChannel.onmessage = _.bind(this.handleMessage, this);
        this.sendChannel.onopen = _.bind(this.handleSendChannelStateChange, this);
        this.sendChannel.onclose = _.bind(this.handleSendChannelStateChange, this);
    },
    onLocalDescriptionGenerated: function (desc) {
        var self = this;
        this.localPeerConnection.setLocalDescription(desc, function() {
            self.signalingChannelSend(JSON.stringify({ "sdp": self.localPeerConnection.localDescription }));
        }, logError);
    },
    rtcsend: function(data) {
        console.log("RTC send message", data);
        this.sendChannel.send(JSON.stringify(data));
    }
});

beez.HiveBroker = Backbone.Model.extend({
    initialize: function (options) {
        this.id = options.id;
        this.peers = new Backbone.Collection();
        this.ws = options.ws;
        this.ws.onmessage = _.bind(this.onmessage, this);
        this.messagecallback = options.onmessage;
    },
    // json: { client_id: 123, data: {} }
    onmessage: function(event) {
        trace('Hive: receive json ')
        var json = JSON.parse(event.data);
        var peer = this.peers.get(json.from);

        if (peer) {
            peer.trigger("message", json.data);
        } else {
            var peer = new beez.Peer({id: json.from, hivebroker: this, isinitiator: false});
            this.peers.add(peer);
            peer.trigger("message", json.data);
        }
    },
    wssend: function(id, json) {
        console.log("send data over websocket: ", {"to": id, "data": json});

        this.ws.send(JSON.stringify( {"to": id, "data": json} ));
    },
    onrtcmessage: function(data) {
        this.messagecallback(data);
    }
});

beez.BeePeerBroker = Backbone.Model.extend({
    initialize: function (options) {
        this.ws = options.ws;
        this.ws.onmessage = _.bind(this.onmessage, this);
        this.peer = new beez.Peer({id: options.id, beepeerbroker: this, isinitiator: true});
        this.messagecallback = options.onmessage;
    },
    onmessage: function(event) {
        var json = JSON.parse(event.data);
        console.log('BeePeerBroker: receive json ', json);

        this.peer.trigger("message", json.data);
    },
    wssend: function(id, json) {
        trace("send data over websocket: " + JSON.stringify(json));
        this.ws.send(JSON.stringify( {"to": "123456789", "data": json} ));
    },
    send: function(json) {
        this.peer.rtcsend(json);
    },
    onrtcmessage: function(data) {
        this.messagecallback(data);
    }
});