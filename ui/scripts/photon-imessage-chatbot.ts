import "./env";

import { startPhotonIMessageBot } from "../lib/photon-imessage-bot";

startPhotonIMessageBot().catch((error) => {
  console.error("[iMessage bot] Fatal error:", error);
  process.exit(1);
});
