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

beez.Parameter = Backbone.Model.extend({
  defaults: {
    from: 0,
    to: 1,
    value: 0,
    curve: "linear"
  },
  initialize: function () {
    this.on("change:curve", this.syncCurve);
    if (!this.get("name")) this.set("name", this.get("id"));
    this.syncCurve();
  },
  syncCurve: function () {
    this.curve = beez.AudioMath.curves[this.get("curve")];
  },
  setPercent: function (percent) {
    var from = this.get("from");
    var to = this.get("to");
    var value = from+this.curve.fun(percent)*(to-from);
    this.set("value", value);
  },
  getPercent: function () {
    var value = this.get("value");
    var from = this.get("from");
    var to = this.get("to");
    return this.curve.inv((value-from)/(to-from));
  }
});

beez.Parameters = Backbone.Collection.extend({
  model: beez.Parameter
});

