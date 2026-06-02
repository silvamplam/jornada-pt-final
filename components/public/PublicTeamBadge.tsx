"use client";

import { useState } from "react";

type PublicTeamBadgeProps = {
  logoUrl?: string | null;
  fallbackLabel: string;
};

function validLogoUrl(value?: string | null) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

export default function PublicTeamBadge({ logoUrl, fallbackLabel }: PublicTeamBadgeProps) {
  const [failed, setFailed] = useState(false);
  const imageUrl = failed ? null : validLogoUrl(logoUrl);

  return (
    <span className="public-team-badge" aria-hidden="true">
      {imageUrl ? <img alt="" src={imageUrl} onError={() => setFailed(true)} /> : fallbackLabel}
    </span>
  );
}
