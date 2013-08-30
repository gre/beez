beez.Sequence = Backbone.Model.extend({
  defaults: {
    bpm: 180,
    // E1 G1 A1 G1 D2 C2 D2 E2
    notes: [164.814, 195.998, 220, 195.998, 293.665, 261.626, 293.665, 329.628]
  },
  initialize: function () {
    this.ctx = this.get("ctx") || new webkitAudioContext();

    this.isPlaying = false;

    this.lookAhead = 25;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = 0;
    this.current16thNote = 0;
    this.timerId = null;
  },

  play: function () {
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduler();
  },

  stop: function () {
    this.isPlaying = false;
    window.clearTimeout( this.timerID );
  },

  nextNote: function () {
    var secondsPerBeat = 60 / this.get("bpm");

    this.nextNoteTime += secondsPerBeat * 0.25;
    this.current16thNote = (this.current16thNote + 1) % this.get("notes").length;
  },

  scheduler: function () {
    var self = this;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.current16thNote, this.nextNoteTime);
        this.nextNote();
    }

    this.timerID = window.setTimeout(function () {
      self.scheduler();
    }, this.lookAhead);
  },

  scheduleNote: function (beatNumber, time) {

    if (!this.audioParam) return;
    this.audioParam.setValueAtTime(this.get("notes")[beatNumber], time)

  }
});
