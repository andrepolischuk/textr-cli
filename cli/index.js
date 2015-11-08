// NPM Modules
import meow     from 'meow';
import stdin    from 'get-stdin';
import textr    from 'textr';

// Native Modules
import path     from 'path';
import fs       from 'fs';

/**
 * CLI app instance of Meow
 * More: https://www.npmjs.com/package/meow
 * @param  {Object|Array|String} Text that will be write on --help or -h
 * @param  {Object}              Minimist options (github.com/substack/minimist)
 * @return {Object}              A Meow CLI helper object
 */
const cli = meow(`
  Usage
    $ textr

  Options
    -t, --transforms    Array of transformers
    -o, --out-file      Write output to file
    -l, --locale        ISO 639 locale codes (en-us as default)
    -h, --help          Show this message

  Examples
    $ textr foo.md -t typographic-quotes -t typographic-quotes
    $ textr foo.md -t typographic-single-spaces,typographic-quotes
    $ cat foo.md | textr -l ru --transforms=typographic-single-spaces
    $ cat foo.md | textr -o bar.md
`,
  {
    default: {
      transforms: [],
    },
    alias: {
      t: 'transforms',
      o: 'out-file',
      l: 'locale',
      h: 'help'
    }
  }
);

/**
 * Resolve file name with current dir
 * @param  {String} file Any relative filename
 * @return {String}      Resolved path to file
 */
const cwd = file =>
  path.resolve(process.cwd(), file);

/**
 * Render text string throught textr transformer
 * @param  {String} text Text that will be processed
 * @param  {Array}  tfs  Array of transformers
 * @return {Void}        Write into strout or file and exit
 */
const render = (text, tfs = [], locale = 'en-us') => {
  const res = (textr({ locale }).use.apply(null, tfs))(text);
  if (cli.flags.outFile) {
    try {
      fs.writeFileSync(cwd(cli.flags.outFile), res, 'utf8');
    } catch (e) {
      console.error(`Something went wrong: ${e.message}`);
      process.exit(1);
    }
  } else {
    process.stdout.write(res);
    process.exit(0);
  }
};

/**
 * Get array of transformers.
 * If list of transformers is a string, then split it.
 * After all, require everything.
 * @param  {String|Array} t String or Array that contains list of transformers
 * @return {Array}          Return array of transform functions
 */
const tfs = (t = cli.flags.transforms) =>
  (typeof t === 'string' ? t.split(',') : t).map(tf => require(tf));

/**
 * Entry point
 */
if (cli.input[0]) {
  // If there is first argument, then read this file
  try {
    render(
      fs.readFileSync(cwd(cli.input[0])).toString(),
      tfs(),
      cli.flags.locale
    );
  } catch (e) {
    console.error(`Something went wrong: ${e.message}`);
    process.exit(1);
  }
} else {
  // If there's no first argument, then try to read stdin
  stdin()
    .then(str => render(str, tfs(), cli.flags.locale))
    .catch(err => err);
}