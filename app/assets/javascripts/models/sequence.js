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

var NOTES = (function () {
  var notes = {};
  var toneSymbols = "CcDdEFfGgAaB";
  function noteToFrequency (note) {
    return Math.pow(2, (note-57)/12)*440;
  }
  for (var octave = 0; octave <= 10; ++octave) {
    for (var t = 0; t < 12; ++t) {
      notes[octave*12+t] = notes[toneSymbols[t]+octave] = noteToFrequency(octave * 12 + t);
    }
  }
  return notes;

}());

function midiNoteForNotation (n) {
  var toneSymbols = "CcDdEFfGgAaB";
  return 33 + toneSymbols.indexOf(n[0]) + 12 * parseInt(n[1]);
}
function frequencyForNote (n) {
  return NOTES[n];
}


beez.Sequence = Backbone.Model.extend({
  defaults: {
    bpm: 180,
    // "E1 G1 A1 G1 D2 C2 D2 E2".split(" ").map(function(n){ return NOTES[n]; })
    //notes: [164.814, 195.998, 220, 195.998, 293.665, 261.626, 293.665, 329.628],
    notes: "E1 G1 A1 G1 D2 C2 D2 E2".split(" ").map(midiNoteForNotation),
    fromNote: 30,
    toNote: 80,
    width: 200,
    height: 500
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

  interpolateTime: function () {
    var secondsPerBeat = 60 / this.get("bpm");
    var length = this.get("notes").length;
    var t = this.current16thNote + Math.min(1, (this.ctx.currentTime - this.nextNoteTime) / (secondsPerBeat/4));
    return (t < 0) ? t + length : t;
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
    var note = this.get("notes")[beatNumber];
    if (note) {
      this.trigger("schedule", frequencyForNote(note), time);
    }
  }
});
