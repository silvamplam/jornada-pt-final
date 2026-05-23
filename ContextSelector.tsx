"use client";

import { useEffect, useMemo, useState } from "react";

type CountryOption = {
  id: string;
  name: string;
};

type CompetitionOption = {
  id: string;
  name: string;
  countryId: string;
};

type SeasonOption = {
  id: string;
  label: string;
  competitionId: string;
  isCurrent: boolean;
};

type ContextSelectorProps = {
  countries: CountryOption[];
  competitions: CompetitionOption[];
  seasons: SeasonOption[];
  selectedCountryId: string;
  selectedCompetitionId: string;
  selectedSeasonId: string;
};

function firstCompetitionForCountry(competitions: CompetitionOption[], countryId: string) {
  return competitions.find((competition) => competition.countryId === countryId)?.id ?? "";
}

function firstSeasonForCompetition(seasons: SeasonOption[], competitionId: string) {
  const competitionSeasons = seasons.filter((season) => season.competitionId === competitionId);
  return competitionSeasons.find((season) => season.isCurrent)?.id ?? competitionSeasons[0]?.id ?? "";
}

function resolveContext({
  countries,
  competitions,
  seasons,
  selectedCountryId,
  selectedCompetitionId,
  selectedSeasonId
}: ContextSelectorProps) {
  const countryId = countries.some((country) => country.id === selectedCountryId)
    ? selectedCountryId
    : countries[0]?.id ?? "";
  const countryCompetitions = competitions.filter((competition) => competition.countryId === countryId);
  const competitionId = countryCompetitions.some((competition) => competition.id === selectedCompetitionId)
    ? selectedCompetitionId
    : countryCompetitions[0]?.id ?? "";
  const competitionSeasons = seasons.filter((season) => season.competitionId === competitionId);
  const seasonId = competitionSeasons.some((season) => season.id === selectedSeasonId)
    ? selectedSeasonId
    : firstSeasonForCompetition(seasons, competitionId);

  return { countryId, competitionId, seasonId };
}

export function ContextSelector(props: ContextSelectorProps) {
  const resolved = resolveContext(props);
  const [countryId, setCountryId] = useState(resolved.countryId);
  const [competitionId, setCompetitionId] = useState(resolved.competitionId);
  const [seasonId, setSeasonId] = useState(resolved.seasonId);

  useEffect(() => {
    const next = resolveContext(props);
    setCountryId(next.countryId);
    setCompetitionId(next.competitionId);
    setSeasonId(next.seasonId);
  }, [
    props.countries,
    props.competitions,
    props.seasons,
    props.selectedCountryId,
    props.selectedCompetitionId,
    props.selectedSeasonId
  ]);

  const competitionsForCountry = useMemo(
    () => props.competitions.filter((competition) => competition.countryId === countryId),
    [props.competitions, countryId]
  );
  const seasonsForCompetition = useMemo(
    () => props.seasons.filter((season) => season.competitionId === competitionId),
    [props.seasons, competitionId]
  );

  function handleCountryChange(nextCountryId: string) {
    const nextCompetitionId = firstCompetitionForCountry(props.competitions, nextCountryId);
    const nextSeasonId = firstSeasonForCompetition(props.seasons, nextCompetitionId);

    setCountryId(nextCountryId);
    setCompetitionId(nextCompetitionId);
    setSeasonId(nextSeasonId);
  }

  function handleCompetitionChange(nextCompetitionId: string) {
    const nextSeasonId = firstSeasonForCompetition(props.seasons, nextCompetitionId);

    setCompetitionId(nextCompetitionId);
    setSeasonId(nextSeasonId);
  }

  return (
    <form className="manager-form" action="/admin/gestor" method="get" autoComplete="off">
      <div className="manager-field">
        <label htmlFor="pais">Pais</label>
        <select id="pais" name="pais" value={countryId} onChange={(event) => handleCountryChange(event.target.value)}>
          {props.countries.length === 0 ? <option value="">Cria um pais primeiro</option> : null}
          {props.countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div className="manager-field">
        <label htmlFor="competicao">Competicao</label>
        <select
          id="competicao"
          name="competicao"
          value={competitionId}
          onChange={(event) => handleCompetitionChange(event.target.value)}
          disabled={competitionsForCountry.length === 0}
        >
          {competitionsForCountry.length === 0 ? <option value="">Cria uma competicao neste pais</option> : null}
          {competitionsForCountry.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </select>
      </div>

      <div className="manager-field">
        <label htmlFor="epoca">Epoca</label>
        <select
          id="epoca"
          name="epoca"
          value={seasonId}
          onChange={(event) => setSeasonId(event.target.value)}
          disabled={seasonsForCompetition.length === 0}
        >
          {seasonsForCompetition.length === 0 ? <option value="">Cria uma epoca nesta competicao</option> : null}
          {seasonsForCompetition.map((season) => (
            <option key={season.id} value={season.id}>
              {season.label}
            </option>
          ))}
        </select>
      </div>

      <button className="manager-button" type="submit" disabled={!countryId}>
        Abrir contexto
      </button>
    </form>
  );
}
