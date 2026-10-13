// Small vector thumbnails share the geometry and colors of the procedural 3D foods.
export function FoodArt({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const art: Record<string, React.ReactNode> = {
    timun: (
      <>
        {[
          [29, 46],
          [47, 39],
          [65, 45],
        ].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 5} rx="17" ry="14" fill="#477747" />
            <ellipse cx={x} cy={y} rx="17" ry="14" fill="#649052" />
            <ellipse cx={x} cy={y} rx="14" ry="11" fill="#dce6ad" />
            <path
              d={`m${x - 5} ${y} 3-3m3 5 3-3m-3-4 3 2`}
              stroke="#f3eed0"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
      </>
    ),
    kerupuk: (
      <>
        {[
          [30, 47, -15],
          [52, 33, 12],
          [65, 52, -10],
        ].map(([x, y, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <path
              d={`M${x - 19} ${y}q-6-13 4-15q8-9 17-4q15-3 18 8q8 10-2 19q-2 10-15 6q-14 5-22-14Z`}
              fill={i % 2 ? "#f7e7c5" : "#eacfa0"}
              stroke="#d6b88b"
              strokeWidth="2"
            />
            <path
              d={`m${x - 8} ${y - 5} 5-3m7 9 5-3m-14 6 3 2`}
              stroke="#e3c598"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
      </>
    ),
    "ikan-kembung": (
      <>
        <path d="m28 44-17-14 3 15-3 14Z" fill="#6d8c81" />
        <path d="m42 31 14-14 11 15m-26 20 15 14 8-14" fill="#6d8c81" />
        <path
          d="M24 44Q37 23 65 30Q78 33 86 44Q73 62 46 57Z"
          fill="#8ca9a0"
        />
        <path d="M25 44Q54 43 86 44Q72 60 47 54Z" fill="#d5ded0" />
        <path
          d="m39 33-4 7m16-10-4 10m16-8-4 8"
          stroke="#577a70"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M67 34Q62 44 68 52" stroke="#738d84" strokeWidth="2" />
        <circle cx="76" cy="40" r="3" fill="#263b35" />
      </>
    ),
    "bakwan-sayur": (
      <>
        <path
          d="M17 47L23 32L39 24L55 27L70 24L81 40L78 58L65 65L46 62L31 66L18 57Z"
          fill="#c58a43"
        />
        <path
          d="M20 44L27 33L39 28L56 31L69 28L77 42L71 54L55 57L38 54L25 57Z"
          fill="#e2b362"
        />
        <path
          d="m32 39 10 9m15-15 9 10m-16 7 9 3"
          stroke="#dd8141"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="m37 33 4 8m15-1-6 9m19-4 3 7"
          stroke="#77934b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    ),
    rice: (
      <>
        <path d="M16 54Q17 27 47 25Q71 25 78 54Q49 72 16 54" fill="#eee6cb" />
        <path
          d="m24 45 6-3m4-8 6 2m9-7 4 4m8 2 6 4m-39 9 5 3m9-9 6 2m9 4 5-1m-19 9 6 1m17-9 3 3"
          stroke="#fffdf0"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    ),
    bread: (
      <>
        <path
          d="M27 22Q15 25 20 38L22 65L69 61L75 31Q78 16 59 15L35 17Z"
          fill="#b77b42"
        />
        <path
          d="M30 27Q22 27 26 37L28 59L63 56L68 32Q69 22 57 23Z"
          fill="#f1d9a9"
        />
        <path d="m67 57 5-25" stroke="#d09b5f" strokeWidth="4" />
      </>
    ),
    noodles: (
      <>
        <ellipse cx="48" cy="53" rx="32" ry="14" fill="#dfb253" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${20 + i * 4} ${49 - i * 4}q16-15 34 0t15 5q-8 12-29 2t-13-4`}
            fill="none"
            stroke={i % 2 ? "#f6d687" : "#edc36a"}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
      </>
    ),
    egg: (
      <>
        <path
          d="M22 48C21 26 33 12 46 17C61 24 63 43 58 57C51 71 27 69 22 48"
          fill="#f4e9d6"
        />
        <ellipse
          cx="61"
          cy="49"
          rx="19"
          ry="24"
          transform="rotate(27 61 49)"
          fill="#fffdf0"
        />
        <ellipse cx="61" cy="51" rx="11" ry="13" fill="#efb641" />
      </>
    ),
    chicken: (
      <>
        <path d="M16 51L22 31L40 22L68 30L81 48L70 62L38 65Z" fill="#c88955" />
        <path d="M18 47L27 29L43 22L66 30L74 43L62 55L37 58Z" fill="#e3af77" />
        <path
          d="m33 31 25 19m-14-24 24 18m-40-5 15 14"
          stroke="#b57747"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    ),
    salmon: (
      <>
        <path d="m17 39 30-18 33 18-5 23-32 6-26-14Z" fill="#cd7862" />
        <path d="m17 39 30-18 33 18-34 19Z" fill="#f19a79" />
        <path
          d="m29 34 29 17m-19-23 28 17m-21-23 30 19"
          stroke="#ffd5b1"
          strokeWidth="3"
        />
        <path d="m19 53 25 12 30-5" stroke="#707867" strokeWidth="5" />
      </>
    ),
    tofu: (
      <>
        {[
          [19, 38],
          [46, 43],
          [35, 20],
        ].map(([x, y], i) => (
          <g key={i}>
            <path d={`m${x} ${y} 18-8 18 9v20l-18 7-18-9Z`} fill="#ded4b7" />
            <path d={`m${x} ${y} 18-8 18 9-18 8Z`} fill="#fcf3d9" />
            <path d={`m${x} ${y} 18 9v19l-18-9Z`} fill="#eee2c5" />
          </g>
        ))}
      </>
    ),
    tempeh: (
      <>
        <path d="m19 32 47-7 13 15-4 22-48 6-12-17Z" fill="#ae784a" />
        <path d="m19 32 47-7 13 15-49 8Z" fill="#d3ac77" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <ellipse
            key={i}
            cx={28 + (i % 4) * 12}
            cy={35 + Math.floor(i / 4) * 8}
            rx="4"
            ry="3"
            fill="#efe0ac"
            transform={`rotate(-20 ${28 + (i % 4) * 12} ${35 + Math.floor(i / 4) * 8})`}
          />
        ))}
      </>
    ),
    broccoli: (
      <>
        <path d="m40 43-6 21 17 4 10-27-14-5Z" fill="#8cad62" />
        <path d="m47 57-16-19m18 13 17-15" stroke="#9cba76" strokeWidth="7" />
        {[
          [26, 33, 14],
          [43, 26, 17],
          [62, 31, 16],
          [42, 40, 16],
        ].map(([x, y, r], i) => (
          <path
            key={i}
            d={`M${x - r},${y}l${r * 0.5},${-r * 0.85} ${r},0 ${r * 0.5},${r * 0.85} ${-r * 0.5},${r * 0.85} ${-r},0Z`}
            fill={["#4b7c4b", "#648f51", "#80a05e", "#507d48"][i]}
          />
        ))}
      </>
    ),
    carrot: (
      <>
        <path d="m27 28 26-1 13 14-42 29-6-5Z" fill="#e89145" />
        <path d="m27 28 26-1 8 10-37 29Z" fill="#f5aa53" />
        <path
          d="m52 28 4-16m1 18 18-12m-12 16 18 0"
          stroke="#76944b"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="m30 39 8 4m-14 7 6 4" stroke="#d67b3b" strokeWidth="3" />
      </>
    ),
    avocado: (
      <>
        <path
          d="M30 30Q41 8 54 19L76 47Q83 70 55 72Q18 70 22 50Z"
          fill="#5e7446"
        />
        <path
          d="M33 32Q44 15 53 24L70 47Q78 65 54 66Q27 65 28 49Z"
          fill="#cfda84"
        />
        <ellipse cx="51" cy="49" rx="14" ry="15" fill="#ac7346" />
        <path d="M40 43Q51 33 60 44L55 54L43 54Z" fill="#bf8b57" />
      </>
    ),
    banana: (
      <>
        <path
          d="M22 22Q36 53 72 37L80 38Q66 73 33 60Q17 52 16 28Z"
          fill="#e4b93c"
        />
        <path d="M22 22Q39 53 72 37Q54 62 32 52Q19 43 18 27Z" fill="#f5d865" />
        <path
          d="m19 24-3-9m60 23 6-4"
          stroke="#877450"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    ),
    apple: (
      <>
        <path
          d="M48 29Q28 15 17 36Q9 60 36 69L49 65Q67 75 78 51Q87 22 63 24Z"
          fill="#cf644d"
        />
        <path d="M46 30Q30 21 22 37Q17 49 26 55L34 44Z" fill="#df7a5d" />
        <path d="m47 29 4-17" stroke="#826448" strokeWidth="5" />
        <path d="M51 20Q66 6 72 18Q60 30 51 20" fill="#819357" />
      </>
    ),
    milk: (
      <>
        <path d="m30 19 34 0-4 49-26 0Z" fill="#d8e4df" />
        <path d="m32 32 30 0-4 31-23 0Z" fill="#fffbed" />
        <ellipse cx="47" cy="20" rx="17" ry="5" fill="#eff3e9" />
        <ellipse cx="47" cy="33" rx="15" ry="4" fill="#fffdf5" />
        <path d="m35 25 3 33" stroke="white" strokeWidth="3" opacity=".7" />
      </>
    ),
    cheese: (
      <>
        <path d="m17 48 47-25 15 23-2 19-58 0Z" fill="#e8b449" />
        <path d="m17 48 47-25 15 23Z" fill="#f6d477" />
        <path d="m17 48 62-2-2 19-58 0Z" fill="#edc05a" />
        <ellipse cx="41" cy="39" rx="5" ry="3" fill="#dba846" />
        <circle cx="34" cy="56" r="4" fill="#cc9740" />
        <circle cx="63" cy="54" r="5" fill="#d6a246" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      viewBox="0 0 96 88"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="48" cy="72" rx="29" ry="5" fill="#524e36" opacity=".07" />
      {art[id]}
    </svg>
  );
}
