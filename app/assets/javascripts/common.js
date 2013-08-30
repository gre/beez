
beez.params = new beez.Parameters(_.map([
  {
    id: "bpm",
    name: "bpm",
    value: 80,
    from: 20,
    to: 450,
    tab: "carrier",
    axis: "x"
  },
  {
    id: "carriergain",
    name: "gain",
    value: 1,
    from: 0,
    to: 1,
    tab: "carrier",
    axis: "y"
  },
  {
    id: "modfreq",
    name: "frequency",
    value: 500,
    from: 20,
    to: 1000,
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
    id: "lfofreq",
    name: "frequency",
    curve: "quad",
    value: 4,
    from: 0,
    to: 20,
    tab: "filterlfo",
    axis: "x"
  },
  {
    id: "lfogain",
    name: "gain",
    value: 400,
    from: 0,
    to: 1000,
    tab: "filterlfo",
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

