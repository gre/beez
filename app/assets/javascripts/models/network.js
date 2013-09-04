(function(){
function trace(text) {
    // console.log(((new Date()).getTime() / 1000) + ": " + text);
}

function logError(error) {
    console.error(error);
}

// FIXME TODO extract the code into an independent lib, keep the Backbone model
// TODO: find better name for functions? onmessage & handleMessage are not clear
// TODO nice to have: onconnect / ondisconnect callback

beez.Peer = Backbone.Model.extend({
    options: {
      servers: {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]}
    },
    initialize: function(options) {
        this.localPeerConnection = null;
        this.createConnection(options.isinitiator);
        //this.sendChannel = null;
    },
    destroy: function (options) { // Overriding default backbone destroy so it doesn't do sync() stuff
      this.trigger("destroy", this, this.collection, options);
    },
    createConnection: function(isinitiator) {
      var servers = this.get("servers");
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
      this.get("sendTo")(this.id, data);
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
      var json = JSON.parse(event.data);
      this.trigger("rtcmessage", json);
    },

    handleSendChannelStateChange: function () {
      var readyState = this.sendChannel.readyState;
      this.trigger(readyState, this);
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
    send: function(data) {
        //console.log("RTC send message", data);
        this.sendChannel.send(JSON.stringify(data));
    }
});

// A collection of peers with some methods
beez.Peers = Backbone.Collection.extend({
  model: beez.Peer,
  send: function (json) {
    this.each(function (peer) {
      peer.send(json);
    });
  }
})

// A Simple WebSocket Backbone Wrapper with send and sendTo methods
beez.WebSocketControl = Backbone.Model.extend({
  initialize: function () {
    this.ws = new WebSocket(this.get("url"));
    this.ws.onclose = _.bind(this.onclose, this);
    this.ws.onopen = _.bind(this.onopen, this);
    this.ws.onmessage = _.bind(this.onmessage, this);
  },
  onopen: function () {
    this.trigger("open");
  },
  onclose: function () {
    this.trigger("close");
  },
  onmessage: function(event) {
    var json = JSON.parse(event.data);
    this.trigger("receive", json);
    if (json.e) {
      this.trigger("receive-"+json.e, json);
    }
  },
  send: function(jsObject) {
    this.ws.send(JSON.stringify(jsObject));
  },
  sendTo: function(to, json) {
    this.ws.send(JSON.stringify({ "to": to, "data": json }));
  }
});

// Provide a WebSocketControl which manage Peers
// This is closely implemented with the server Room actors
beez.WebSocketPeersManager = beez.WebSocketControl.extend({
  initialize: function () {
    beez.WebSocketControl.prototype.initialize.apply(this, arguments);
    this.incomingPeers = new beez.Peers();
    this.peers = new beez.Peers();

    this.incomingPeers.on("open", function (peer) {
      this.peers.add(peer);
      this.incomingPeers.remove(peer);
    }, this);

    function handlePeerMessage (msg) {
      this.trigger("@"+msg.e, msg, this);
    }
    this.peers.on("add", function (peer) {
      peer.on("rtcmessage", handlePeerMessage, peer);
    }, this);
    this.peers.on("remove", function (peer) {
      peer.off("rtcmessage", handlePeerMessage);
    }, this);

    this.on({
      "open": function (json) {
        this.send({
          e: "ready",
          role: this.get("role")
        });
      },
      "receive-disconnect": function (json) {
        var peer = this.peers.get(json.id) || this.incomingPeers.get(json.id);
        peer && peer.destroy(); // will remove peer from the collections
      },
      "receive-broadcast": function (json) {
        var data = json.data;
        if (data.e === "ready" && this.get("acceptRoles").indexOf(data.role) > -1) {
          this.sendTo(json.id, {
            e: "hello",
            role: this.get("role")
          });
          var peer = new beez.Peer({
            id: json.id,
            sendTo: _.bind(this.sendTo, this),
            isinitiator: true,
            role: data.role
          })
          this.incomingPeers.add(peer);
        }
      },
      "receive-talk": function (json) {
        var peer = this.incomingPeers.get(json.from);
        var isHello = json.data && json.data.e == "hello";
        if (!peer && isHello) {
          peer = new beez.Peer({
            id: json.from,
            sendTo: _.bind(this.sendTo, this),
            isinitiator: false,
            role: json.data.role
          });
          this.incomingPeers.add(peer);
        }
        if (peer && !isHello) {
          peer.onmessage(json.data);
        }
      }
    });
  }
});

}());
