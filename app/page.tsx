import { HomeDashboard } from "@/components/HomeDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { getHomeContext } from "@/lib/jornada";

export default function HomePage() {
  const context = getHomeContext();

  return (
    <>
      <SiteHeader competitions={context.competitions} />
      <div className="page-shell">
        <HomeDashboard context={context} />
      </div>
    </>
  );
}
