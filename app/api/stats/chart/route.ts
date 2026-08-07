import { getChartSeries } from "@/lib/rpc";
import { ok, fail, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

const METRICS = ["tps", "gas", "volume"] as const;
type Metric = (typeof METRICS)[number];

/** GET /api/stats/chart?metric=tps — a real series over the most recent blocks. */
export async function GET(request: Request) {
  const metric = new URL(request.url).searchParams.get("metric") ?? "tps";

  if (!METRICS.includes(metric as Metric)) {
    return fail(`metric must be one of: ${METRICS.join(", ")}`);
  }

  try {
    return ok(await getChartSeries(metric as Metric));
  } catch (error) {
    return handleError(error, "GET /api/stats/chart");
  }
}
