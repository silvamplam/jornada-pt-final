const items = [
  {
    icon: "◷",
    title: "O futebol em contexto",
    text: "Consulte notícias, resultados e histórias sempre ligadas à jornada e à competição."
  },
  {
    icon: "▦",
    title: "Por jornada e competição",
    text: "Explore cada jornada, compare épocas e acompanhe todas as competições."
  },
  {
    icon: "▥",
    title: "Dados objetivos",
    text: "Estatísticas completas, rankings e dados fiáveis para analisar e comparar."
  },
  {
    icon: "☆",
    title: "A sua referência",
    text: "A fonte independente para fãs que querem entender o futebol em profundidade."
  }
];

export function InstitutionalStrip() {
  return (
    <section className="institutional-strip" aria-label="Jornada.pt em contexto">
      {items.map((item) => (
        <article key={item.title}>
          <span aria-hidden="true">{item.icon}</span>
          <div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
