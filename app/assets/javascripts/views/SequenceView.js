/*
 * This file is part of Beez.
 *
 * Copyright 2014 Zengularity
 *
 * Beez is free software: you can redistribute it and/or modify
 * it under the terms of the AFFERO GNU General Public License as published by
 * the Free Software Foundation.
 *
 * Beez is distributed "AS-IS" AND WITHOUT ANY WARRANTY OF ANY KIND,
 * INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY,
 * NON-INFRINGEMENT, OR FITNESS FOR A PARTICULAR PURPOSE. See
 * the AFFERO GNU General Public License for the complete license terms.
 *
 * You should have received a copy of the AFFERO GNU General Public License
 * along with Beez.  If not, see <http://www.gnu.org/licenses/agpl-3.0.html>
 */
var major = [ 0, 2, 4, 5, 7, 9, 11 ];
var MODE_HEIGHT = 30;
beez.NotesView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    var self = this;
    this.listenTo(this.model, "change:notes", this.syncNotes);
    this.listenTo(this.model, "change:width change:height change:notesheightratio", this.syncSize);
    (function loop () {
      requestAnimationFrame(loop);
      self.render();
    }());
    this.syncSize();
  },

  events: {
    "mousedown": "onMouseDown",
    "mousemove": "onMouseMove",
    "mouseup": "onMouseUp"
  },

  onMouseDown: function (e) {
    this.down = true;
    this.onMouseMove(e);
  },

  onMouseUp: function (e) {
    this.down = false;
  },

  onMouseMove: function (e) {
    if (!this.down) return;
    var offset = this.$el.offset(),
        x = (e.clientX - offset.left)/this.canvas.width*2,
        y = (e.clientY - offset.top)/this.canvas.height*2;
    var notes = this.model.get("notes");
    var length = notes.length;
    var i = Math.floor(x * length);
    var j = Math.floor((1-y) * 12);
    var notes = _.clone(this.model.get("notes"));
    notes[i] = 12 * Math.floor(notes[i] / 12) + j;
    this.model.set("notes", notes);
  },

  syncNotes: function () {
  },

  syncSize: function () {
    var w = this.model.get("width");
    var h = Math.floor((this.model.get("height")-MODE_HEIGHT) * this.model.get("notesheightratio")) + 10;
    this.el.style.width = w+"px";
    this.el.style.height = h+"px";
    this.canvas.width = w*2;
    this.canvas.height = h*2;
  },

  render: function () {
    var ctx = this.ctx;
    var width = this.canvas.width;
    var height = this.canvas.height;
    var t = this.model.interpolateTime();
    var notes = this.model.get("notes");
    var length = notes.length;
    var sw = width / length;
    var sh = height / 12;
    var m = 2;
    var x, y;
    ctx.clearRect(0,0,width,height);
    for (var i=0; i<length; ++i) {
      x = Math.floor(sw * i);
      var isCurrentBeat = i < t && t < i + 1;
      for (var j=0; j<12; ++j) {
        y = height - Math.floor(sh * j) - sh;
        var hasNote = (notes[i] % 12) === j;
        var isMajor = major.indexOf(j) !== -1;
        ctx.fillStyle = isMajor ? 
          (hasNote ? isCurrentBeat ? "#789" : "#cde" : "#f5faff")
          :
          (hasNote ? isCurrentBeat ? "#789" : "#cde" : "#ebf5ff")
          ;
        ctx.beginPath();
        ctx.rect(x+m, y+m, sw-2*m, sh-2*m);
        ctx.fill();
      }
    }
  }
});

beez.OctavesView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    var self = this;
    this.listenTo(this.model, "change:notes", this.syncNotes);
    this.listenTo(this.model, "change:width change:height change:notesheightratio", this.syncSize);
    (function loop () {
      requestAnimationFrame(loop);
      self.render();
    }());
    this.syncSize();
  },

  events: {
    "mousedown": "onMouseDown",
    "mousemove": "onMouseMove",
    "mouseup": "onMouseUp",

    "mouseenter": "onMouseEnter",
    "mouseleave": "onMouseUp"

  },

  onMouseDown: function (e) {
    this.down = true;
    this.onMouseMove(e);
  },

  onMouseUp: function (e) {
    this.down = false;
  },

  onMouseMove: function (e) {
    if (!this.down) return;
    var offset = this.$el.offset(),
        x = (e.clientX - offset.left)/this.canvas.width*2,
        y = (e.clientY - offset.top)/this.canvas.height*2;
    var notes = this.model.get("notes");
    var fromOctave = this.model.get("fromOctave");
    var toOctave = this.model.get("toOctave");
    var length = notes.length;
    var gridNoteLength = 1 + toOctave - fromOctave;
    var i = Math.floor(x * length);
    var notes = _.clone(this.model.get("notes"));
    notes[i] = (notes[i] % 12) + 12*(fromOctave + Math.floor((1-y) * gridNoteLength));
    this.model.set("notes", notes);
  },

  onMouseEnter: function (e) {
  },

  onMouseLeave: function (e) {
  },

  syncNotes: function () {
  },

  syncSize: function () {
    var w = this.model.get("width");
    var h = Math.floor((this.model.get("height")-MODE_HEIGHT) * (1-this.model.get("notesheightratio")));
    this.el.style.width = w+"px";
    this.el.style.height = h+"px";
    this.canvas.width = w*2;
    this.canvas.height = h*2;
  },

  render: function () {
    var ctx = this.ctx;
    var width = this.canvas.width;
    var height = this.canvas.height;
    var t = this.model.interpolateTime();
    var notes = this.model.get("notes");
    var fromOctave = this.model.get("fromOctave");
    var toOctave = this.model.get("toOctave");
    var length = notes.length;
    var gridNoteLength = 1 + toOctave - fromOctave;
    var sw = width / length;
    var sh = height / gridNoteLength;
    var m = 2;
    var x, y;
    ctx.clearRect(0,0,width,height);
    for (var i=0; i<length; ++i) {
      x = Math.floor(sw * i);
      var isCurrentBeat = i < t && t < i + 1;
      for (var j=0; j<=gridNoteLength; ++j) {
        y = height - Math.floor(sh * j) - sh;
        var hasNote = Math.floor(notes[i] / 12) === fromOctave + j;
        ctx.fillStyle = hasNote ? isCurrentBeat ? "#987" : "#edc" : "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.rect(x+m, y+m, sw-2*m, sh-2*m);
        ctx.fill();
      }
    }
  }
});

beez.NoteModesView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    var self = this;
    this.listenTo(this.model, "change:modes", this.syncNotes);
    this.listenTo(this.model, "change:width", this.syncSize);
    (function loop () {
      requestAnimationFrame(loop);
      self.render();
    }());
    this.syncSize();
  },

  events: {
    "click": "onClick"
  },

  onClick: function (e) {
    var offset = this.$el.offset(),
        x = (e.clientX - offset.left)/this.canvas.width*2,
        y = (e.clientY - offset.top)/this.canvas.height*2;
    var modes = _.clone(this.model.get("modes"));
    var i = Math.floor(modes.length * x);
    modes[i] = modes[i] < 2 ? modes[i]+1 : 0;
    this.model.set("modes", modes);
  },

  syncSize: function () {
    var w = this.model.get("width");
    this.el.style.width = w+"px";
    this.el.style.height = MODE_HEIGHT+"px";
    this.canvas.width = w*2;
    this.canvas.height = MODE_HEIGHT*2;
  },

  render: function () {
    var ctx = this.ctx;
    var width = this.canvas.width;
    var height = this.canvas.height;
    var t = this.model.interpolateTime();
    var modes = this.model.get("modes");
    var length = modes.length;
    var sw = width / length;
    var sh = this.canvas.height;
    var m = 2;
    var x, y = 0;
    var theme = 0;
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,width,height);
    for (var i=0; i<length; ++i) {
      x = Math.floor(sw * i);
      var mode = modes[i];
      var isCurrentBeat = i < t && t < i + 1;
      var color = mode === 0 ?
        [ theme, "90%", "50%", 0.8 ] : mode === 1 ?
        [ theme, "50%", "70%", 0.8 ] :
        [ theme, "0%", "0%", 0.1 ];
      color[3] *= isCurrentBeat ? 1 : 0.8;
      ctx.fillStyle = "hsla("+color.join(",")+")";
      ctx.beginPath();
      ctx.rect(x+m, y+m, sw-2*m, sh-2*m);
      ctx.fill();
    }
  }
});

beez.SequenceView = Backbone.View.extend({
  initialize: function () {
    var notesNode = document.createElement("div");
    var modesNode = document.createElement("div");
    var octavesNode = document.createElement("div");
    this.notesView = new beez.NotesView({
      model: this.model,
      el: notesNode
    });
    this.octavesView = new beez.OctavesView({
      model: this.model,
      el: octavesNode
    });
    this.modesView = new beez.NoteModesView({
      model: this.model,
      el: modesNode
    });
    this.$el.append(notesNode);
    notesNode.style.marginBottom = "5px";
    this.$el.append(octavesNode);
    octavesNode.style.marginBottom = "5px";
    this.$el.append(modesNode);
  }
});

