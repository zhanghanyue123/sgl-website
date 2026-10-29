export default function Films() {
  return (
    <div id="films" className="overflow-hidden border border-sglInk bg-black">
      <iframe
        className="aspect-video w-full"
        src="https://www.youtube-nocookie.com/embed/M7WZuQpVkkQ?autoplay=1&mute=1&playsinline=1&loop=1&playlist=M7WZuQpVkkQ,QiUlZJLe0Tw,SvMaYabZabA&rel=0"
        title="SGL films — New York, Shanghai and Beijing"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
