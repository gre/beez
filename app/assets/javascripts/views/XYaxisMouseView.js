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
beez.XYaxisMouseView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:x change:y", this.syncParam);
    this.listenTo(this.model, "change", this.render);
    this.syncSize();
    this.syncParam();
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

  onMouseMove: function (e) {
    if (!this.down) return;

    var offset = this.$el.offset(),
        x = (e.clientX - offset.left)/this.canvas.width*2,
        y = (e.clientY - offset.top)/this.canvas.height*2;

    this.model.set({
      x: x,
      y: 1 - y,
      changing: true
    });

  },

  onMouseUp: function (e) {
    this.down = false;
    this.onMouseMove(e);
    this.model.set({
      changing: false
    });
  },

  onMouseEnter: function (e) {
    if (e.which === 1) {
      this.onMouseDown(e);
    }
  },

  onMouseLeave: function (e) {
    this.onMouseUp(e);
  },

  syncSize: function () {
    var w = this.model.get("width");
    var h = this.model.get("height");
    this.el.style.width = w+"px";
    this.el.style.height = h+"px";
    this.canvas.width = w*2;
    this.canvas.height = h*2;
  },

  syncParam: function () {
    this.render();
  },

  render: function () {

    var c = this.ctx,
        canvas = this.canvas,
        backgroundColor = "rgba(250,250,250,0.7)";

    c.clearRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = backgroundColor;
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.lineWidth = 8;
    c.strokeStyle = "#789";
    c.strokeRect(0, 0, canvas.width, canvas.height);

    c.lineWidth = 2;
    for (var i=0; i<4; ++i) {
      var x = Math.round(canvas.width*i/4);
      c.globalAlpha = i%2==0 ? 1 : 0.2;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, canvas.height);
      c.stroke();
    }
    for (var i=0; i<4; ++i) {
      var y = Math.round(canvas.height*i/4);
      c.globalAlpha = i%2==0 ? 1 : 0.2;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(canvas.width, y);
      c.stroke();
    }
    c.globalAlpha = 1;

    c.font = "bold 20pt Helvetica, Arial, sans-serif";

    // Main label
    var dimensions = c.measureText(this.model.get("name"));
    c.fillStyle = backgroundColor;
    c.fillRect((canvas.width - dimensions.width) / 2 - 10, (canvas.height  / 2) - 20, dimensions.width + 20, 40);

    c.fillStyle = "#789";
    c.fillText(this.model.get("name"), (canvas.width - dimensions.width) / 2, (canvas.height  / 2) + 8);

    // Axis labels
    c.save();
    c.font = "16pt Helvetica, Arial, sans-serif";

    dimensions = c.measureText(this.model.get("xlabel"));
    c.fillText(this.model.get("xlabel"), canvas.width - dimensions.width - 10, canvas.height - 14);

    dimensions = c.measureText(this.model.get("ylabel"));
    c.translate(24, dimensions.width + 12);
    c.rotate(-Math.PI / 2);
    c.fillText(this.model.get("ylabel"), 0, 0);
    c.restore();

    // Circle
    var radius = this.model.get("changing") ? 16 : 12;
    c.lineWidth = this.model.get("changing") ? 12 : 8;
    c.strokeStyle = "hsl(0, 50%, 50%)";
    c.beginPath();
    c.arc(canvas.width * this.model.get("x"), canvas.height * (1 - this.model.get("y")), radius, 0, Math.PI * 2, false);
    c.stroke();


  }
});

