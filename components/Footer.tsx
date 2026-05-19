export default function Footer() {
  return (
    <footer className="border-t border-sglInk bg-sglInk text-sglCream">
      <div className="mx-auto grid max-w-sgl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="text-3xl font-black uppercase">SGL</p>
          <p className="mt-3 max-w-sm text-sm leading-6 opacity-80">
            Urban riding goods, station life, and small rituals for everyday movement.
          </p>
        </div>
        <div className="text-sm leading-6">
          <p className="font-bold uppercase tracking-wide text-sglAcid">Commerce</p>
          <p className="mt-3 opacity-80">Replace the temporary Shopify links with Taobao, WeChat Mini Program, or staff contact links.</p>
        </div>
        <div className="text-sm leading-6">
          <p className="font-bold uppercase tracking-wide text-sglCyan">Station</p>
          <p className="mt-3 opacity-80">Add address, opening hours, menu QR, and ride group entrance here.</p>
        </div>
      </div>
    </footer>
  );
}
