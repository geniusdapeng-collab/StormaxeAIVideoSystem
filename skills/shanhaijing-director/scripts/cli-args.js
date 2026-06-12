// scripts/cli-args.js
// 轻量参数解析器，替换手工 argv 解析
function parseArgs(argv = process.argv.slice(2)) {
  const result = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];

    if (item.startsWith('--')) {
      const key = item.slice(2);
      const next = argv[i + 1];

      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else {
      result._.push(item);
    }
  }

  return result;
}

module.exports = { parseArgs };
