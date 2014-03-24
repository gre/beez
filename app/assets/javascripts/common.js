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

beez.params = new beez.Parameters(_.map([
  {
    id: "bpm",
    name: "bpm",
    value: 20,
    from: 20,
    to: 200,
    tab: "carrier",
    axis: "x"
  },
  {
    id: "carriergain",
    name: "gain",
    value: 0.5,
    from: 0,
    to: 1,
    tab: "carrier",
    axis: "y"
  },
  {
    id: "moddetune",
    name: "finetune",
    value: 0,
    from: -20,
    to: 20,
    tab: "modulator",
    axis: "x"
  },
  {
    id: "modgain",
    name: "gain",
    value: 100,
    from: 0,
    to: 500,
    tab: "modulator",
    axis: "y"
  },
  {
    id: "modmult",
    name: "modulator",
    value: 1,
    from: 0,
    to: 2,
    tab: "FM multiplicator",
    axis: "x"
  },
  {
    id: "carriermult",
    name: "carrier",
    value: 1,
    from: 0,
    to: 2,
    tab: "FM multiplicator",
    axis: "y"
  },
  {
    id: "reverbdry",
    name: "dry",
    value: 0.5,
    from: 0,
    to: 1,
    tab: "reverb",
    axis: "x"
  },
  {
    id: "reverbwet",
    name: "wet",
    value: 0.5,
    from: 0,
    to: 1,
    tab: "reverb",
    axis: "y"
  },
  {
    id: "filterfreq",
    name: "frequency",
    curve: "quad",
    value: 1000,
    from: 0,
    to: 5000,
    tab: "filter",
    axis: "x"
  },
  {
    id: "filterQ",
    name: "resonance",
    curve: "quad",
    value: 1,
    from: 0,
    to: 20,
    tab: "filter",
    axis: "y"
  }
], function (o) {
  return new beez.Parameter(o);
}));
