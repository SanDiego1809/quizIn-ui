export default function FavoriteCelebration({ size = 100, color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="10,10 20,20" />
      <polygon points="10,50 20,50" />
      <polygon points="20,80 30,70" />
      <polygon points="90,10 80,20" />
      <polygon points="90,50 80,50" />
      <polygon points="80,80 70,70" />
    </svg>
  );
}
