// AboutUsBadge.jsx
export default function AboutUsBadge({
  className = "w-40 h-12", // Tailwind sizing
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White filled rectangle with black border */}
      <rect
        x="1"
        y="1"
        width="198"
        height="48"
        rx="8"
        ry="8"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />

      {/* Text centered */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
        fill="black"
      >
        About Us
      </text>
    </svg>
  );
}
