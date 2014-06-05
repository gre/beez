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
beez.SequenceView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    var self = this;
    this.listenTo(this.model, "change:notes", this.syncNotes);
    this.listenTo(this.model, "change:width change:height", this.syncSize);
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
    var fromNote = this.model.get("fromNote");
    var toNote = this.model.get("toNote");
    var length = notes.length;
    var gridNoteLength = 1 + toNote - fromNote;
    var i = Math.floor(x * length);
    var j = fromNote + Math.floor((1-y) * gridNoteLength) + 1;
    var notes = this.model.get("notes");
    notes[i] = j;
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
    var h = this.model.get("height");
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
    var fromNote = this.model.get("fromNote");
    var toNote = this.model.get("toNote");
    var length = notes.length;
    var gridNoteLength = 1 + toNote - fromNote;
    var sw = width / length;
    var sh = height / gridNoteLength;
    var m = 2;
    var x, y;
    ctx.clearRect(0,0,width,height);
    for (var i=0; i<length; ++i) {
      x = Math.floor(sw * i);
      var isCurrentBeat = i < t && t < i + 1;
      for (var j=0; j<gridNoteLength; ++j) {
        y = height - Math.floor(sh * j);
        var hasNote = notes[i] === fromNote + j;
        ctx.fillStyle = hasNote ? isCurrentBeat ? "#789" : "#cde" : "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.rect(x+m, y+m, sw-2*m, sh-2*m);
        ctx.fill();
      }
    }

    /*
    x = t * sw;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    */
  }
});

