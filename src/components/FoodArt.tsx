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
          [20, 49, -12],
          [48, 30, 8],
          [76, 49, -7],
        ].map(([x, y, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <ellipse cx={x} cy={y + 4} rx="14" ry="11" fill="#356b35" />
            <ellipse cx={x} cy={y} rx="14" ry="11" fill="#4b8240" />
            <ellipse cx={x} cy={y} rx="12.8" ry="9.8" fill="#e2edc9" />
            {[0, 120, 240].map((rotation) => (
              <g key={rotation} transform={`rotate(${rotation} ${x} ${y})`}>
                <ellipse cx={x + 5} cy={y} rx="4.5" ry="2.8" fill="#d4e5b2" />
                {[0, 1, 2].map((seed) => (
                  <g key={seed}>
                    <ellipse
                      cx={x + 3 + seed * 2}
                      cy={y - 1.2}
                      rx="1.2"
                      ry=".65"
                      fill="#fff8d8"
                    />
                    <ellipse
                      cx={x + 3 + seed * 2}
                      cy={y + 1.2}
                      rx="1.2"
                      ry=".65"
                      fill="#fff8d8"
                    />
                  </g>
                ))}
              </g>
            ))}
          </g>
        ))}
      </>
    ),
    "timun-whole": (
      <g transform="rotate(-24 48 44)">
        <path
          d="M14 44C14 32 22 27 35 27L66 29C78 30 84 36 84 44C84 53 77 59 64 59L33 61C20 61 14 55 14 44Z"
          fill="#56883b"
        />
        <path
          d="M17 39Q26 29 40 32L65 34Q76 35 81 41Q64 37 39 37Q23 36 17 43Z"
          fill="#a2be6d"
        />
        <path
          d="M18 48Q35 44 62 48L81 46M24 55Q47 50 72 53"
          stroke="#7fa450"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <ellipse
            key={i}
            cx={25 + i * 6}
            cy={40 + (i % 3) * 4}
            rx="1.2"
            ry=".7"
            fill="#b4ca7c"
          />
        ))}
        <path d="m83 42 0 4" stroke="#c1b384" strokeWidth="2" />
      </g>
    ),
    kerupuk: (
      <>
        {[
          [29, 48, -24],
          [50, 32, 16],
          [65, 53, -13],
        ].map(([x, y, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <path
              d={`M${x - 20} ${y - 2}q-3-8 4-11q4-7 11-5q9-5 15 2q10-1 12 8q5 7-1 13q-3 8-12 7q-9 4-16-2q-10 1-13-12Z`}
              fill="#f5e7c5"
              stroke="#d8b47e"
              strokeWidth="1.4"
            />
            <path
              d={`M${x - 19} ${y - 4}q8 18 24 14q9-1 15-10q-3 15-17 17q-18 3-22-21Z`}
              fill="#e5cea3"
            />
            {[
              [-10, -5],
              [-3, 3],
              [5, -7],
              [12, 0],
              [-1, -9],
              [7, 7],
              [-12, 2],
            ].map(([dx, dy], j) => (
              <ellipse
                key={j}
                cx={x + dx}
                cy={y + dy}
                rx="2.1"
                ry="1.4"
                fill={j % 2 ? "#fff3d5" : "#e6d1a9"}
              />
            ))}
          </g>
        ))}
      </>
    ),
    "ikan-kembung": (
      <>
        <path d="m27 44-19-16 6 16-6 16 19-12Z" fill="#718579" />
        <path d="m35 35 7-14 19 12m-27 17-7 12 25-7" fill="#6e8574" />
        <path
          d="M22 44Q39 24 62 31Q78 33 89 43Q75 55 58 57Q35 58 22 46Z"
          fill="#afc5c2"
        />
        <path
          d="M22 44Q41 24 62 31Q76 33 89 43Q68 35 49 37Q34 37 22 44Z"
          fill="#426965"
        />
        <path d="M23 46Q51 53 87 44Q72 57 54 56Q35 55 23 46Z" fill="#e0e5d8" />
        <path
          d="M31 40Q47 30 65 36M30 42Q47 35 62 38"
          stroke="#809e93"
          strokeWidth="1"
        />
        <path d="M68 35Q61 44 68 52" stroke="#6d8881" strokeWidth="1.5" />
        <path d="m62 45-14 5 10-8Z" fill="#91a391" />
        <circle cx="77" cy="41" r="4.2" fill="#e4e7d6" />
        <circle cx="77" cy="41" r="3" fill="#b4a764" />
        <circle cx="77" cy="41" r="2.1" fill="#243a34" />
        <path d="m85 44 3-.6" stroke="#6d827b" strokeWidth="1" />
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
