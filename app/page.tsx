import { HomeDashboard } from "@/components/HomeDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { applyBroadcastOverridesToHomeContext, getHomeContext } from "@/lib/jornada";
import { getPublicBroadcastOverrides } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const context = applyBroadcastOverridesToHomeContext(getHomeContext(), await getPublicBroadcastOverrides());

  return (
    <>
      <SiteHeader competitions={context.competitions} />
      <div className="page-shell">
        <HomeDashboard context={context} />
      </div>
    </>
  );
}
