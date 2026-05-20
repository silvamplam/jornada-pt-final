import type { Team } from "@/lib/jornada";

type TeamBadgeProps = {
  team: Team;
};

export function TeamBadge({ team }: TeamBadgeProps) {
  return (
    <span className={`team-badge team-badge-${team.badgeTone}${team.logo ? " team-badge-logo" : ""}`} title={team.name}>
      {team.logo ? <img src={team.logo} alt="" /> : team.shortName}
    </span>
  );
}
