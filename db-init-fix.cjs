// Temporary startup compatibility patch for the PostgreSQL DO block in server.js.
// It rewrites the invalid single-dollar delimiter before pg sends the query.
try {
  const pg = require("pg");
  const Pool = pg.Pool;
  const originalQuery = Pool.prototype.query;
  Pool.prototype.query = function patchedQuery(config, values, callback) {
    if (typeof config === "string" && config.includes("DO $ BEGIN")) {
      config = config.replace("DO $ BEGIN", "DO $$ BEGIN").replace("END $;", "END $$;");
    } else if (config && typeof config.text === "string" && config.text.includes("DO $ BEGIN")) {
      config = { ...config, text: config.text.replace("DO $ BEGIN", "DO $$ BEGIN").replace("END $;", "END $$;") };
    }
    return originalQuery.call(this, config, values, callback);
  };
} catch (err) {
  console.error("PostgreSQL compatibility patch failed to load:", err);
}
