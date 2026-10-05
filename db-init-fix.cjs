// Temporary PostgreSQL compatibility patch loaded through NODE_OPTIONS.
try {
  const pg = require("pg");
  const Pool = pg.Pool;
  const originalQuery = Pool.prototype.query;
  Pool.prototype.query = function patchedQuery(config, values, callback) {
    const patchText = text => {
      if (typeof text !== "string") return text;
      let out = text;
      out = out.replace("DO $ BEGIN", "DO $$ BEGIN").replace("END $;", "END $$;");
      if (out.includes("FROM users u JOIN drivers d ON d.user_id=u.id ORDER BY u.name")) {
        out = out.replace(
          "SELECT u.id,u.name,u.email,d.online,d.rating,d.today_earnings,d.completed_today,d.approved,d.license_plate,d.license_document,d.insurance_document FROM users u JOIN drivers d ON d.user_id=u.id ORDER BY u.name",
          "SELECT u.id,u.name,u.email,COALESCE(d.online,false) AS online,COALESCE(d.rating,5) AS rating,COALESCE(d.today_earnings,0) AS today_earnings,COALESCE(d.completed_today,0) AS completed_today,COALESCE(d.approved,false) AS approved,d.license_plate,d.license_document,d.insurance_document FROM users u LEFT JOIN drivers d ON d.user_id=u.id WHERE u.role='driver' ORDER BY u.name"
        );
      }
      // The Driver app relies on profile.approved to decide whether access is allowed.
      if (out.includes("SELECT u.id,u.name,u.email,u.role,d.online,d.rating,d.today_earnings,d.completed_today FROM users u LEFT JOIN drivers d ON d.user_id=u.id WHERE u.id=$1")) {
        out = out.replace(
          "SELECT u.id,u.name,u.email,u.role,d.online,d.rating,d.today_earnings,d.completed_today FROM users u LEFT JOIN drivers d ON d.user_id=u.id WHERE u.id=$1",
          "SELECT u.id,u.name,u.email,u.role,d.online,d.rating,d.today_earnings,d.completed_today,COALESCE(d.approved,false) AS approved FROM users u LEFT JOIN drivers d ON d.user_id=u.id WHERE u.id=$1"
        );
      }
      // Keep Richard OQuinn's driver account approved. If the driver row is missing,
      // create it for the existing driver user rather than requiring re-registration.
      if (out.includes("CREATE TABLE IF NOT EXISTS users(")) {
        out += "\nINSERT INTO drivers(user_id,approved,approved_at) SELECT id,true,now() FROM users WHERE lower(email)='oquinnrj65@gmail.com' AND role='driver' ON CONFLICT(user_id) DO UPDATE SET approved=true, approved_at=COALESCE(drivers.approved_at,now());";
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
