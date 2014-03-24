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

beez.XYaxisTouchableView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:x change:y", this.syncParam);
    this.listenTo(this.model, "change", this.render);
    this.syncSize();
    this.syncParam();
    this.el.addEventListener("touchstart", _.bind(this.onTouchstart, this), false);
    this.el.addEventListener("touchmove", _.bind(this.onTouchmove, this), false);
    this.el.addEventListener("touchend", _.bind(this.onTouchend, this), false);
    this.el.addEventListener("touchcancel", _.bind(this.onTouchcancel, this), false);
    this.identifier = null;
  },

  getCurrentTouch: function (e) {
    for (var i=0; i<e.changedTouches.length; ++i)
      if (e.changedTouches[i].identifier === this.identifier)
        return e.changedTouches[i];
  },

  getPosition: function (touch) {
    var width = this.model.get("width");
    var height = this.model.get("height");
    var x = Math.max(0, Math.min(touch.clientX, width)) / width;
    var y = Math.max(0, Math.min(touch.clientY-OFFSET_Y, height)) / height;
    return { x: x, y: 1-y };
  },

  onTouchstart: function (e) {
    e.preventDefault();
    if (this.identifier !== null) return;
    var touch = e.changedTouches[0];
    this.identifier = touch.identifier;
    var position = this.getPosition(touch);
    this.model.set({
      x: position.x,
      y: position.y,
      changing: true
    });
  },
  
  onTouchmove: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    var position = this.getPosition(touch);
    this.model.set({
      x: position.x,
      y: position.y
    });
  },
  
  onTouchcancel: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    this.identifier = null;
    this.model.set({
      changing: false
    });
  },

  onTouchend: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    this.identifier = null;
    this.model.set({
      changing: false
    });
  },

  syncSize: function () {
    this.canvas.width = this.model.get("width");
    this.canvas.height = this.model.get("height");
  },

  syncParam: function () {
    this.render();
  },

  render: function () {
    var c = this.ctx,
        canvas = this.canvas,
        backgroundColor = "#123";

    c.fillStyle = backgroundColor;
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.lineWidth = 1;
    c.strokeStyle = "#789";


    // Axis labels
    c.font = "16pt Helvetica, Arial, sans-serif";
    c.fillStyle = "#789";

    // grid
    c.strokeStyle = "#789";
    c.lineWidth = 1;
    var GRID = 8;
    for (var i=1; i<GRID; ++i) {
      var x = Math.round(canvas.width*i/GRID);
      c.globalAlpha = i==GRID/2 ? 1 : i%2==0 ? 0.5 : 0.2;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, canvas.height);
      c.stroke();
    }
    for (var i=1; i<GRID; ++i) {
      var y = Math.round(canvas.height*i/GRID);
      c.globalAlpha = i==GRID/2 ? 1 : i%2==0 ? 0.5 : 0.2;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(canvas.width, y);
      c.stroke();
    }
    c.globalAlpha = 1;

    // labels
    c.fillStyle = backgroundColor;
    var xdim = c.measureText(this.model.get("xlabel"));
    c.fillRect(0, 0, 40, xdim.width+20);
    var ydim = c.measureText(this.model.get("ylabel"));
    c.fillRect(canvas.width-ydim.width-12, canvas.height-36, ydim.width+12, 36);

    c.save();
    c.fillStyle = "#789";
    dimensions = c.measureText(this.model.get("xlabel"));
    c.fillText(this.model.get("xlabel"), canvas.width - dimensions.width - 10, canvas.height - 12);
    dimensions = c.measureText(this.model.get("ylabel"));
    c.translate(26, dimensions.width + 12);
    c.rotate(-Math.PI / 2);
    c.fillText(this.model.get("ylabel"), 0, 0);
    c.restore();

    // pointer
    c.save();
    c.shadowBlur = 6;
    c.shadowColor = c.strokeStyle = !this.model.get("changing") ? "#fff" : "#9cf";
    c.lineWidth = !this.model.get("changing") ? 2 : 6;
    var x = canvas.width * this.model.get("x");
    var y = canvas.height * (1-this.model.get("y"));
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, canvas.height);
    c.stroke();
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(canvas.width, y);
    c.stroke();
    c.restore();
  }
});


