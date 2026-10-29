const films = [
  { id: "M7WZuQpVkkQ", title: "Seagull 2025 | NewYork", location: "NEW YORK", duration: "1:41" },
  { id: "QiUlZJLe0Tw", title: "Story 001 Shanghai | ChrissySGLL9 Ti", location: "SHANGHAI", duration: "3:10" },
  { id: "SvMaYabZabA", title: "Bike Build 001 Beijing | ChrissySGLL9 Ti", location: "BEIJING", duration: "4:04" },
];

export default function Films() {
  return (
    <section id="films" aria-labelledby="films-title" className="border-b border-sglInk bg-sglInk text-sglCream">
      <div className="mx-auto max-w-sgl px-4 py-16 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-sglAcid">SGL Films</p>
            <h2 id="films-title" className="mt-3 text-4xl font-black uppercase md:text-6xl">Stories in motion.</h2>
            <p className="mt-5 opacity-75">城市、骑行与造车故事。从纽约、上海到北京。</p>
          </div>
          <a href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer" className="border-b border-sglAcid py-2 font-black uppercase text-sglAcid">Visit YouTube ↗</a>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {films.map((film) => (
            <article key={film.id}>
              <iframe className="aspect-video w-full border border-sglCream/30" src={`https://www.youtube-nocookie.com/embed/${film.id}`} title={film.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              <p className="mt-5 text-xs font-black tracking-[0.2em] text-sglAcid">{film.location} / {film.duration}</p>
              <h3 className="mt-2 text-xl font-black">{film.title}</h3>
              <a href={`https://www.youtube.com/watch?v=${film.id}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block border-b border-sglCream/50 text-sm">Watch on YouTube ↗</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
