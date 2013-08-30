
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

