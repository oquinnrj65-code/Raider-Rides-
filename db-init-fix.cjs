// Temporary PostgreSQL compatibility patch loaded through NODE_OPTIONS.
try {
  const pg = require("pg");
  const Pool = pg.Pool;
  const originalQuery = Pool.prototype.query;
  Pool.prototype.query = function patchedQuery(config, values, callback) {
    const patchText = text => {
      if (typeof text !== "string") return text;
      let out = text;
      // Fix the PostgreSQL anonymous block delimiter used by older deployments.
      out = out.replace("DO $ BEGIN", "DO $$ BEGIN").replace("END $;", "END $$;");
      // Make the admin approval queue resilient: every user whose role is driver
      // must appear even if its driver row was not created by an older registration.
      if (out.includes("FROM users u JOIN drivers d ON d.user_id=u.id ORDER BY u.name")) {
        out = out.replace(
          "SELECT u.id,u.name,u.email,d.online,d.rating,d.today_earnings,d.completed_today,d.approved,d.license_plate,d.license_document,d.insurance_document FROM users u JOIN drivers d ON d.user_id=u.id ORDER BY u.name",
          "SELECT u.id,u.name,u.email,COALESCE(d.online,false) AS online,COALESCE(d.rating,5) AS rating,COALESCE(d.today_earnings,0) AS today_earnings,COALESCE(d.completed_today,0) AS completed_today,COALESCE(d.approved,false) AS approved,d.license_plate,d.license_document,d.insurance_document FROM users u LEFT JOIN drivers d ON d.user_id=u.id WHERE u.role='driver' ORDER BY u.name"
        );
      }
      // Richard OQuinn is the Raider Rides owner and must remain an approved driver.
      // This only changes this one owner's driver record and does not alter other drivers.
      if (out.includes("CREATE TABLE IF NOT EXISTS users(")) {
        out += "\nUPDATE drivers d SET approved=true, approved_at=COALESCE(d.approved_at,now()) FROM users u WHERE d.user_id=u.id AND lower(u.email)='oquinnrj65@gmail.com' AND u.role='driver';";
      }
      return out;
    };
    if (typeof config === "string") config = patchText(config);
    else if (config && typeof config.text === "string") config = { ...config, text: patchText(config.text) };
    return originalQuery.call(this, config, values, callback);
  };
} catch (err) {
  console.error("Raider Rides PostgreSQL compatibility patch failed to load:", err);
}
