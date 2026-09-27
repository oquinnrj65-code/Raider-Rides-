export const esc = (value) => {
  const s = String(value ?? "");
  return s.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;");
};

export const money = (value) => Number(value || 0).toLocaleString("en-US", {
  style: "currency",
  currency: "USD"
});

const appMeta = {
  rider: {
    label: "RIDER APP",
    tag: "SAFE. RELIABLE. ON TIME.",
    footer: "YOUR RIDE. OUR PRIORITY."
  },
  driver: {
    label: "DRIVER APP",
    tag: "DRIVE. EARN. BE PART OF SOMETHING BIGGER.",
    footer: "DRIVE WITH PURPOSE."
  },
  admin: {
    label: "ADMIN APP",
    tag: "MANAGE. APPROVE. GROW.",
    footer: "BUILDING A BETTER TOMORROW."
  }
};

export function shell(title, active, body) {
  const meta = appMeta[active] || appMeta.rider;
  const links = ["rider", "driver", "admin"]
    .map((role) => {
      const cls = role === active ? "active" : "";
      const label = role.charAt(0).toUpperCase() + role.slice(1);
      return '<a class="' + cls + '" href="/' + role + '" data-link>' + label + "</a>";
    })
    .join("");

  return [
    '<div class="app-shell">',
    '<header class="top">',
    '<button class="mobile-menu" type="button" aria-label="Menu">☰</button>',
    '<a class="brand" href="/' + active + '" data-link><img src="/assets/raider-rides-logo.svg" alt="Raider Rides"></a>',
    '<nav class="nav">' + links + "</nav>",
    '<span class="status"><i></i> API LIVE</span>',
    "</header>",
    "<main>",
    '<section class="app-hero">',
    '<img src="/assets/raider-rides-logo.svg" alt="">',
    "<div>",
    '<p class="eyebrow">RAIDER RIDES</p>',
    "<h1>" + meta.label + "</h1>",
    "<p>" + meta.tag + "</p>",
    "</div>",
    "</section>",
    '<div class="app-content">' + body + "</div>",
    '<footer class="app-footer"><span>RAIDER RIDES</span><strong>' + meta.footer + "</strong></footer>",
    "</main>",
    "</div>"
  ].join("");
}

export const card = (title, body) =>
  '<section class="card"><div class="card-title"><span>' + title + "</span></div>" + body + "</section>";

export const table = (headers, rows) => {
  const head = headers.map((h) => "<th>" + h + "</th>").join("");
  const body = rows.length
    ? rows.map((row) => "<tr>" + row.map((cell) => "<td>" + cell + "</td>").join("") + "</tr>").join("")
    : '<tr><td colspan="' + headers.length + '" class="empty">No records.</td></tr>';
  return '<div class="table-wrap"><table><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
};

export const toast = (message) => {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 3000);
};
