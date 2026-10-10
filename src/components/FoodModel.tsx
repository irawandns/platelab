import type { ThreeElements } from "@react-three/fiber";
type ShapeProps = Omit<ThreeElements["mesh"], "args"> & { color: string };
function Facet({ color, ...props }: ShapeProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={0.95} />
    </mesh>
  );
}
function Box({ color, ...props }: ShapeProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry />
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </mesh>
  );
}
function Stem({ color = "#74945c", ...props }: ShapeProps) {
  return (
    <mesh castShadow {...props}>
      <cylinderGeometry args={[0.07, 0.09, 0.45, 6]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}
export function FoodModel({ id }: { id: string }) {
  switch (id) {
    case "rice":
      return (
        <group>
          <Facet
            color="#f0e7d3"
            position={[0, 0.18, 0]}
            scale={[0.53, 0.29, 0.44]}
          />
          {Array.from({ length: 22 }, (_, i) => (
            <Facet
              key={i}
              color={i % 2 ? "#fff7e3" : "#e9ddc5"}
              position={[
                Math.sin(i * 2.4) * 0.4 * Math.sqrt(i / 22),
                0.19 + 0.18 * (1 - i / 28),
                Math.cos(i * 2.4) * 0.34 * Math.sqrt(i / 22),
              ]}
              rotation={[0, i, 0]}
              scale={[0.095, 0.065, 0.055]}
            />
          ))}
        </group>
      );
    case "bread":
      return (
        <group rotation={[0, 0.25, 0]}>
          <Box
            color="#b77c47"
            scale={[0.65, 0.16, 0.66]}
            position={[0, 0.1, 0.02]}
          />
          <Facet
            color="#b77c47"
            scale={[0.39, 0.1, 0.25]}
            position={[0, 0.1, -0.3]}
          />
          <Box
            color="#f3dbaa"
            scale={[0.54, 0.035, 0.57]}
            position={[0, 0.2, 0.02]}
          />
          <Facet
            color="#f3dbaa"
            scale={[0.32, 0.026, 0.18]}
            position={[0, 0.2, -0.27]}
          />
        </group>
      );
    case "noodles":
      return (
        <group>
          <Facet
            color="#dfb253"
            position={[0, 0.13, 0]}
            scale={[0.49, 0.19, 0.42]}
          />
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              castShadow
              rotation={[Math.PI / 2 + (i % 2) * 0.15, 0, i * 0.6]}
              position={[
                Math.sin(i) * 0.07,
                0.2 + i * 0.012,
                Math.cos(i) * 0.06,
              ]}
              scale={[1, 0.75, 1]}
            >
              <torusGeometry
                args={[0.16 + i * 0.034, 0.035, 5, 13, Math.PI * 1.85]}
              />
              <meshStandardMaterial
                color={i % 2 ? "#eac06a" : "#f8da8a"}
                roughness={0.9}
              />
            </mesh>
          ))}
        </group>
      );
    case "egg":
      return (
        <group>
          <Facet
            color="#f5ede0"
            position={[-0.15, 0.26, 0]}
            scale={[0.24, 0.34, 0.24]}
          />
          <mesh
            castShadow
            position={[0.22, 0.1, 0.12]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.25, 0.21, 0.1, 12]} />
            <meshStandardMaterial color="#fff8e8" />
          </mesh>
          <Facet
            color="#efb333"
            position={[0.22, 0.17, 0.12]}
            scale={[0.15, 0.07, 0.15]}
          />
        </group>
      );
    case "chicken":
      return (
        <group rotation={[0, -0.3, 0]}>
          <Facet
            color="#d29968"
            position={[0, 0.2, 0]}
            scale={[0.54, 0.23, 0.38]}
          />
          <Facet
            color="#e7b482"
            position={[-0.1, 0.23, -0.05]}
            scale={[0.43, 0.2, 0.33]}
          />
          {[-0.2, 0, 0.2].map((x) => (
            <Box
              key={x}
              color="#ae754c"
              position={[x, 0.403, 0]}
              rotation={[0, 0.4, 0]}
              scale={[0.026, 0.012, 0.4]}
            />
          ))}
        </group>
      );
    case "salmon":
      return (
        <group rotation={[0, 0.2, 0]}>
          <Box
            color="#697565"
            position={[0, 0.07, 0]}
            scale={[0.75, 0.1, 0.49]}
          />
          <Box
            color="#eb9676"
            position={[0, 0.19, 0]}
            scale={[0.76, 0.22, 0.48]}
          />
          {[-0.26, -0.08, 0.1, 0.28].map((x) => (
            <Box
              key={x}
              color="#ffd4b2"
              position={[x, 0.305, 0]}
              rotation={[0, 0.28, 0]}
              scale={[0.025, 0.012, 0.47]}
            />
          ))}
        </group>
      );
    case "tofu":
      return (
        <group>
          {[
            [-0.19, 0.14, 0.16],
            [0.2, 0.14, 0.06],
            [0, 0.4, -0.08],
          ].map((p, i) => (
            <Box
              key={i}
              color={i === 2 ? "#f6edd5" : "#e9dfc3"}
              position={p as [number, number, number]}
              rotation={[0, i * 0.35, 0]}
              scale={[0.36, 0.27, 0.34]}
            />
          ))}
        </group>
      );
    case "tempeh":
      return (
        <group rotation={[0, 0.3, 0]}>
          <Box
            color="#c29768"
            position={[0, 0.15, 0]}
            scale={[0.72, 0.26, 0.46]}
          />
          {Array.from({ length: 15 }, (_, i) => (
            <Facet
              key={i}
              color={i % 2 ? "#e5d1a3" : "#f0dcad"}
              scale={[0.056, 0.025, 0.043]}
              position={[
                -0.28 + (i % 5) * 0.14,
                0.29,
                -0.15 + Math.floor(i / 5) * 0.15,
              ]}
            />
          ))}
        </group>
      );
    case "broccoli":
      return (
        <group>
          {[
            [-0.21, 0, 0.12],
            [0.2, 0, 0.05],
            [0, 0.05, -0.18],
          ].map((p, i) => (
            <group
              key={i}
              position={p as [number, number, number]}
              rotation={[0, i, 0.15]}
            >
              <Stem position={[0, 0.2, 0]} color="#91ad6b" />
              <Facet
                color={["#658c4b", "#4f7c43", "#789953"][i]}
                position={[0, 0.45, 0]}
                scale={[0.28, 0.23, 0.26]}
              />
              <Facet
                color="#83a361"
                position={[-0.13, 0.44, 0.04]}
                scale={[0.16, 0.15, 0.15]}
              />
            </group>
          ))}
        </group>
      );
    case "carrot":
      return (
        <group rotation={[0, 0, -1.05]} position={[0, 0.24, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.17, 0.85, 7]} />
            <meshStandardMaterial color="#f09b45" flatShading />
          </mesh>
          {[-0.35, 0, 0.35].map((r) => (
            <Stem
              key={r}
              color="#7c9652"
              position={[r * 0.12, 0.5, 0]}
              rotation={[0, 0, r]}
              scale={[0.48, 0.55, 0.5]}
            />
          ))}
        </group>
      );
    case "avocado":
      return (
        <group rotation={[0.2, 0, 0]}>
          <Facet
            color="#607845"
            position={[0, 0.17, 0]}
            scale={[0.33, 0.2, 0.46]}
          />
          <Facet
            color="#cdd78a"
            position={[0, 0.27, -0.01]}
            scale={[0.285, 0.08, 0.405]}
          />
          <Facet
            color="#a47747"
            position={[0, 0.34, 0.09]}
            scale={[0.16, 0.11, 0.17]}
          />
        </group>
      );
    case "banana":
      return (
        <group rotation={[-Math.PI / 2, 0, -0.3]} position={[0, 0.12, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.38, 0.105, 6, 10, Math.PI * 1.15]} />
            <meshStandardMaterial color="#f1ce59" flatShading />
          </mesh>
          <Facet
            color="#827249"
            position={[0.4, 0, 0]}
            scale={[0.07, 0.09, 0.065]}
          />
          <Facet
            color="#a28c4b"
            position={[-0.34, -0.17, 0]}
            scale={[0.065, 0.07, 0.065]}
          />
        </group>
      );
    case "apple":
      return (
        <group>
          <Facet
            color="#cf6650"
            position={[0, 0.3, 0]}
            scale={[0.35, 0.33, 0.33]}
          />
          <Facet
            color="#dd7a5e"
            position={[-0.13, 0.34, 0.06]}
            scale={[0.2, 0.26, 0.22]}
          />
          <Stem
            color="#826447"
            position={[0, 0.62, 0]}
            scale={[0.42, 0.4, 0.4]}
            rotation={[0, 0, -0.15]}
          />
          <Facet
            color="#7e9553"
            position={[0.14, 0.65, 0]}
            rotation={[0, 0, 0.3]}
            scale={[0.18, 0.045, 0.08]}
          />
        </group>
      );
    case "milk":
      return (
        <group>
          <mesh castShadow position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.25, 0.2, 0.62, 12]} />
            <meshStandardMaterial color="#d5e4dc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.635, 0]}>
            <cylinderGeometry args={[0.223, 0.223, 0.014, 12]} />
            <meshStandardMaterial color="#fffbed" />
          </mesh>
          <Box
            color="#edf4e8"
            position={[-0.12, 0.35, 0.195]}
            scale={[0.035, 0.4, 0.025]}
          />
        </group>
      );
    case "cheese":
      return (
        <group rotation={[0, 0.4, 0]}>
          <mesh
            castShadow
            position={[0, 0.19, 0]}
            rotation={[0, Math.PI / 6, 0]}
          >
            <cylinderGeometry args={[0.47, 0.47, 0.3, 3]} />
            <meshStandardMaterial color="#edc159" flatShading />
          </mesh>
          {[
            [-0.08, 0.348, -0.07],
            [0.15, 0.348, 0.05],
            [-0.19, 0.348, 0.09],
          ].map((p, i) => (
            <mesh
              key={i}
              position={p as [number, number, number]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.055 + i * 0.01, 8]} />
              <meshStandardMaterial color="#cfa044" />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}
