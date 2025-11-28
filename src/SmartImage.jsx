export default function SmartImage({ src, alt = "", className = "" }) {
  const base = src.replace(/\.(png|jpg|jpeg)$/i, "");

  const thumb = `/Images/thumbnails/${base}-thumb.webp`;
  const fullWebp = `/Images/output-webp/${base}.webp`;
  const fallback = `/Images/${src}`;

  return (
    <picture>
      <source srcSet={fullWebp} type="image/webp" />
      <img
        src={thumb}
        data-full={fallback}
        alt={alt}
        className={className + " smart-image"}
        loading="lazy"
        style={{ filter: "blur(10px)", transition: "0.4s" }}
        onLoad={(e) => {
          const full = new Image();
          full.src = fullWebp;
          full.onload = () => {
            e.target.src = fullWebp;
            e.target.style.filter = "blur(0px)";
          };
        }}
      />
    </picture>
  );
}
export default function SmartImage({ src, alt = "", className = "" }) {
  const base = src.replace(/\.(png|jpg|jpeg)$/i, "");
  const webp = `/Images/output-webp/${base}.webp`;
  const fallback = `/Images/${src}`;

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img src={fallback} alt={alt} className={className} loading="lazy" />
    </picture>
  );
}