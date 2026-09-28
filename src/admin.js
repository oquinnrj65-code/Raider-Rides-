import { api } from "./api.js";
import { shell, card, table, esc, money, toast } from "./ui.js";
import { getAuth, clearAuth, authScreen } from "./auth.js";

export async function renderAdmin() {
  const session = getAuth();
  if (!session || session.user?.role !== "admin") {
    return authScreen("admin", renderAdmin);
  }

  const app = document.querySelector("#app");
  app.innerHTML =
    shell(
      "Admin",
      "admin",
      '<button id="adminLogout" class="secondary" type="button">Sign out</button>' +
      card(
        "Invite team member",
        '<p>Only an administrator can create team invitations.</p>' +
          '<form id="inviteForm" class="form">' +
          '<label>Team member email (optional)<input id="inviteEmail" type="email" placeholder="team@example.com"></label>' +
          '<button class="primary" type="submit">Create invitation</button>' +
          '</form><div id="inviteResult" class="gps-status"></div>'
      ) +
      '<div id="stats" class="stats">Loading…</div>' +
      '<div class="grid">' +
      card("Rides", '<div id="adminRides">Loading…</div>') +
      card("Drivers", '<div id="drivers">Loading…</div>') +
      "</div>"
    );

  document.querySelector("#adminLogout").onclick = () => {
    clearAuth();
    renderAdmin();
  };

  document.querySelector("#inviteForm").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      const email = document.querySelector("#inviteEmail").value.trim();
      const result = await api.admin.invite({ email });
      document.querySelector("#inviteResult").innerHTML =
        '<strong>Invitation created.</strong><br>Send this <b>Admin app</b> link to the team member:<br>' +
        '<input value="' + esc(result.inviteUrl || "") + '" readonly onclick="this.select()">' +
        '<div class="gps-status"><b>One-time admin code:</b><br><input value="' + esc(result.inviteCode || result.inviteToken || "") + '" readonly onclick="this.select()"></div>' +
        '<small>This code works once. The invitation link opens the Admin app and carries the same one-time code automatically.</small>';
    } catch (err) {
      toast(err.message);
    } finally {
      button.disabled = false;
    }
  };

  try {
    const [stats, rides, drivers] = await Promise.all([
      api.admin.stats(),
      api.admin.rides(),
      api.admin.drivers()
    ]);

    document.querySelector("#stats").innerHTML = [
      ["Active rides", stats.activeRides],
      ["Online drivers", stats.driversOnline],
      ["Rides today", stats.ridesToday],
      ["Revenue", money(stats.revenueToday)]
    ].map(item =>
      '<div class="stat"><b>' + esc(item[1] ?? 0) + "</b>" + item[0] + "</div>"
    ).join("");

    document.querySelector("#adminRides").innerHTML = table(
      ["Status", "Rider", "Driver", "Fare"],
      (rides.rides || rides || []).map(item => [
        esc(item.status),
        esc(item.riderName || "—"),
        esc(item.driverName || "—"),
        money(item.fare)
      ])
    );

    document.querySelector("#drivers").innerHTML = table(
      ["Driver", "Plate", "Status", "Rating", "Documents", "Authorization"],
      (drivers.drivers || drivers || []).map(item => [
        esc(item.name) + (item.email ? "<br><small>" + esc(item.email) + "</small>" : ""),
        esc(item.licensePlate || "—"),
        item.online ? "Online" : "Offline",
        esc(item.rating ?? "—"),
        item.hasLicenseDocument && item.hasInsuranceDocument
          ? '<button class="secondary view-driver-docs" data-id="' + esc(item.id) + '">View documents</button>'
          : '<span class="muted">Missing documents</span>',
        item.approved
          ? '<span class="muted">Authorized</span>'
          : '<button class="primary approve-driver" data-id="' + esc(item.id) + '">Authorize driver</button>'
      ])
    );

    document.querySelectorAll(".view-driver-docs").forEach(button => {
      button.onclick = async () => {
        button.disabled = true;
        try {
          const result = await api.admin.driverDocuments(button.dataset.id);
          const win = window.open("", "_blank");
          if (!win) throw new Error("Allow pop-ups to view documents.");

          const license = result.licenseDocument?.data
            ? '<p><a download="drivers-license" href="' + result.licenseDocument.data + '">Open/download license</a></p>' +
              '<iframe style="width:100%;height:70vh" src="' + result.licenseDocument.data + '"></iframe>'
            : "<p>Not on file.</p>";

          const insurance = result.insuranceDocument?.data
            ? '<p><a download="insurance" href="' + result.insuranceDocument.data + '">Open/download insurance</a></p>' +
              '<iframe style="width:100%;height:70vh" src="' + result.insuranceDocument.data + '"></iframe>'
            : "<p>Not on file.</p>";

          win.document.write(
            "<title>Raider Rides Driver Documents</title>" +
            "<h2>Private driver documents</h2>" +
            "<p>License plate: " + esc(result.licensePlate || "—") + "</p>" +
            "<h3>Driver's license</h3>" + license +
            "<h3>Current insurance</h3>" + insurance
          );
          win.document.close();
        } catch (err) {
          toast(err.message);
        } finally {
          button.disabled = false;
        }
      };
    });

    document.querySelectorAll(".approve-driver").forEach(button => {
      button.onclick = async () => {
        button.disabled = true;
        try {
          await api.admin.setDriverApproval(button.dataset.id, true);
          toast("Driver authorized");
          await renderAdmin();
        } catch (err) {
          button.disabled = false;
          toast(err.message);
        }
      };
    });
  } catch (err) {
    toast(err.message);
    document.querySelector("#stats").innerHTML =
      '<div class="empty">Admin API unavailable.</div>';
  }
}
