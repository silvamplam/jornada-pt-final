"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  return (
    <span className="public-team-badge" aria-hidden="true" data-logo-url={logoUrl ?? ""}>
      {imageUrl ? (
        <img
          alt=""
          src={imageUrl}
          onError={() => {
            if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug_logos") === "1") {
              console.warn("Emblema falhou ao carregar", { fallbackLabel, logoUrl: imageUrl });
            }
            setFailed(true);
          }}
        />
      ) : (
        fallbackLabel
      )}
    </span>
  );
}
