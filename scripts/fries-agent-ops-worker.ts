import { runFriesAgentOpsOnce } from "../lib/integrations/fries-worker";

runFriesAgentOpsOnce()
  .then((result) => console.log(JSON.stringify(result)))
  .catch((error) => {
    console.error(JSON.stringify({ status: "failed", errorCode: error instanceof Error ? error.message.replace(/[^a-z0-9_. -]/gi, "").slice(0, 80) : "unknown" }));
    process.exitCode = 1;
  });
