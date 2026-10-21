import { hydrateRoot } from "hono/jsx/dom/client";
import { Dashboard, type DashboardProps } from "@/views/dashboard.tsx";

const root = document.getElementById("dashboard-root");
const data = document.getElementById("dashboard-props");

if (root && data) {
    const props = JSON.parse(data.textContent ?? "{}") as DashboardProps;
    hydrateRoot(root, <Dashboard {...props} />);
}
