import { AppInitializer } from "./services/AppInitializer.js";

// Initialize the app when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  const appInitializer = new AppInitializer();
  await appInitializer.initialize();
});
