import serialize from '@xterm/addon-serialize';

// SerializeAddon preserves mouse tracking (1000/1002/1003), but omits the
// wire encoding (1006/1016). After a tab switch a fullscreen CLI otherwise
// receives legacy mouse bytes instead of the SGR reports it requested.
// Observe the public parser API, including fragmented and combined sequences;
// returning false leaves xterm's own mode handling unchanged.
export class TerminalSnapshotAddon extends serialize.SerializeAddon {
  activate(terminal) {
    super.activate(terminal);
    this.encoding = 0;
    const mode = enabled => params => {
      for (const value of params) {
        if (value === 1006 || value === 1016) this.encoding = enabled ? value : 0;
      }
      return false;
    };
    this.handlers = [
      terminal.parser.registerCsiHandler({ prefix: '?', final: 'h' }, mode(true)),
      terminal.parser.registerCsiHandler({ prefix: '?', final: 'l' }, mode(false)),
      terminal.parser.registerEscHandler({ final: 'c' }, () => { this.encoding = 0; return false; }),
    ];
  }

  serialize(options) {
    const screen = super.serialize(options);
    if (options?.excludeModes) return screen;
    return screen + '\x1b[?1006l\x1b[?1016l' + (this.encoding ? `\x1b[?${this.encoding}h` : '');
  }

  dispose() {
    for (const handler of this.handlers || []) handler.dispose();
    this.handlers = [];
    super.dispose();
  }
}
