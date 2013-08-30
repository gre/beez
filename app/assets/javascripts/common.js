
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
    value: 0,
    from: 0,
    to: 1,
    tab: "carrier",
    axis: "y"
  },
  {
    id: "modmult",
    name: "multiplicator",
    value: 1,
    from: 0.25,
    to: 3,
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
