const familyIds = new Set([
  "potato",
  "sweet-potato",
  "corn",
  "peas",
  "green-beans",
  "tomato",
  "orange",
  "strawberry",
]);

export function FoodFamilyArt({ id }: { id: string }) {
  if (!familyIds.has(id)) return null;
  if (id === "potato" || id === "sweet-potato")
    return (
      <>
        {[
          [28, 49, -15],
          [51, 33, 12],
          [65, 53, -8],
        ].map(([x, y, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <path
              d={`M${x - 16} ${y}l8-14 23 4 5 17-15 9-20-4Z`}
              fill={id === "potato" ? "#e5ce96" : "#de8d43"}
            />
            <path
              d={`M${x - 16} ${y}l8-14 23 4-4 12Z`}
              fill={id === "potato" ? "#f4e3b8" : "#efb065"}
            />
          </g>
        ))}
      </>
    );
  if (id === "corn" || id === "peas")
    return (
      <>
        <path
          d="M17 58Q14 33 44 29Q75 25 82 54L69 66L33 68Z"
          fill={id === "corn" ? "#d9ab3a" : "#739649"}
        />
        {Array.from({ length: 23 }, (_, i) => {
          const angle = i * 2.399963,
            radius = Math.sqrt(i / 23) * 25;
          return (
            <ellipse
              key={i}
              cx={48 + Math.cos(angle) * radius}
              cy={48 + Math.sin(angle) * radius * 0.6}
              rx={id === "corn" ? 5 : 4.5}
              ry={id === "corn" ? 3.5 : 4.5}
              fill={
                id === "corn"
                  ? i % 3
                    ? "#e8bc49"
                    : "#ffdf78"
                  : i % 3
                    ? "#88a750"
                    : "#a3b869"
              }
            />
          );
        })}
      </>
    );
  if (id === "green-beans")
    return (
      <>
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M${22 + i * 7} ${31 + (i % 3) * 4}q-13 20 7 33`}
            stroke={i % 2 ? "#789c50" : "#58834c"}
            strokeWidth="6"
            strokeLinecap="round"
            transform={`rotate(${((i % 3) - 1) * 24} 48 48)`}
          />
        ))}
      </>
    );
  if (id === "tomato")
    return (
      <>
        {[
          [28, 47],
          [52, 33],
          [65, 55],
        ].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 3} rx="20" ry="14" fill="#c74f3e" />
            <ellipse cx={x} cy={y} rx="18" ry="12" fill="#ec7660" />
            {[0, 120, 240].map((angle) => (
              <ellipse
                key={angle}
                cx={x + 9}
                cy={y}
                rx="3"
                ry="1.5"
                fill="#f6c18a"
                transform={`rotate(${angle} ${x} ${y})`}
              />
            ))}
          </g>
        ))}
      </>
    );
  if (id === "orange")
    return (
      <>
        {[
          [27, 47, -20],
          [53, 34, 5],
          [66, 54, 20],
        ].map(([x, y, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <path
              d={`M${x - 18} ${y + 8}l18-25 18 25Q${x} ${y + 18} ${x - 18} ${y + 8}Z`}
              fill="#ef9f3d"
              stroke="#ffdc95"
              strokeWidth="2"
            />
            <path
              d={`M${x} ${y - 14}v27m0-24-10 22m10-22 10 22`}
              stroke="#ffdc95"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </>
    );
  return (
    <>
      {[
        [28, 49, -18],
        [51, 31, 12],
        [69, 52, 8],
      ].map(([x, y, angle], i) => (
        <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
          <path
            d={`M${x - 14} ${y - 9}Q${x} ${y - 20} ${x + 14} ${y - 9}Q${x + 16} ${y + 6} ${x} ${y + 20}Q${x - 16} ${y + 6} ${x - 14} ${y - 9}Z`}
            fill="#cc514b"
          />
          <path d={`M${x} ${y - 9}l-14-7 10 0 4-7 4 7 10 0Z`} fill="#608947" />
          {[-6, 0, 6].map((dx, j) => (
            <ellipse
              key={j}
              cx={x + dx}
              cy={y + (j % 2) * 7}
              rx="1"
              ry="1.7"
              fill="#f5c585"
            />
          ))}
        </g>
      ))}
    </>
  );
}
