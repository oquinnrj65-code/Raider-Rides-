import pg from 'pg';
const { Pool } = pg;
const originalQuery = Pool.prototype.query;
function fix(text) {
  return String(text).replace(/DO \$ BEGIN([\s\S]*?)END \$;/g, 'DO $$ BEGIN$1END $$;');
}
Pool.prototype.query = function(config, ...args) {
  if (typeof config === 'string') return originalQuery.call(this, fix(config), ...args);
  if (config && typeof config.text === 'string') return originalQuery.call(this, { ...config, text: fix(config.text) }, ...args);
  return originalQuery.call(this, config, ...args);
};
