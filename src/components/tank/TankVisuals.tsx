import { useMemo, type RefObject, type MutableRefObject } from "react";
import * as THREE from "three";
import { ChassisPart, WeaponPart, WeaponType } from "../../data/parts";
import { makeTrackTexture } from "../../game/visuals";

const HULL: Record<string, string> = {
  chassis_wasp: "#556B4F",
  chassis_crabber: "#4a5c42",
  chassis_doomshock: "#5C5D4A",
  chassis_oblivion: "#424D45",
  chassis_morrow: "#3d4a3a",
};

/** Chassis hull only — no gun mount (weapon owns the holder) */
export function ChassisHull({
  chassis,
  trackMatL,
  trackMatR,
  trackTex,
  wheelRefs,
}: {
  chassis: ChassisPart;
  trackMatL: RefObject<THREE.MeshStandardMaterial | null>;
  trackMatR: RefObject<THREE.MeshStandardMaterial | null>;
  trackTex: THREE.CanvasTexture;
  wheelRefs: MutableRefObject<(THREE.Mesh | null)[]>;
}) {
  const [w, h, l] = chassis.size;
  const color = HULL[chassis.id] ?? "#556B4F";
  const trackY = -h / 2 + 0.2;
  const id = chassis.id;

  // Shape variants from concept silhouettes
  const lowProfile = id === "chassis_doomshock" || id === "chassis_oblivion";
  const dualTrack = id === "chassis_crabber";
  const longHull = id === "chassis_oblivion" || id === "chassis_morrow";
  const scout = id === "chassis_wasp";

  const hullH = lowProfile ? h * 0.55 : h * 0.7;
  const hullL = longHull ? l * 1.05 : scout ? l * 0.9 : l * 0.88;
  const hullW = dualTrack ? w * 1.05 : w * 0.92;

  return (
    <group>
      {/* Lower sponson */}
      <mesh position={[0, -h * 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * (dualTrack ? 1.15 : 1.05), h * 0.5, l * 0.98]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.88} />
      </mesh>
      {/* Main hull */}
      <mesh position={[0, lowProfile ? h * 0.02 : h * 0.08, longHull ? -0.05 : 0]} castShadow receiveShadow>
        <boxGeometry args={[hullW, hullH, hullL]} />
        <meshStandardMaterial color={color} metalness={0.18} roughness={0.82} />
      </mesh>
      {/* Glacis / nose */}
      <mesh
        position={[0, h * (lowProfile ? 0.12 : 0.2), l * (scout ? 0.32 : 0.28)]}
        rotation={[lowProfile ? -0.28 : -0.16, 0, 0]}
        castShadow
      >
        <boxGeometry args={[hullW * 0.92, h * 0.28, l * (lowProfile ? 0.38 : 0.28)]} />
        <meshStandardMaterial color={color} metalness={0.12} roughness={0.9} />
      </mesh>
      {/* Morrow med cross hint */}
      {id === "chassis_morrow" && (
        <mesh position={[0, h * 0.35, -l * 0.1]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#e8e4d4" metalness={0.1} roughness={0.7} />
        </mesh>
      )}
      {/* Oblivion vents */}
      {id === "chassis_oblivion" && (
        <mesh position={[0, h * 0.28, -l * 0.15]} castShadow>
          <boxGeometry args={[0.9, 0.12, 0.55]} />
          <meshStandardMaterial color="#2a2f2a" metalness={0.3} roughness={0.6} />
        </mesh>
      )}

      {/* Tracks */}
      {([-1, 1] as const).map((side, si) => (
        <group
          key={side}
          position={[side * (w / 2 + (dualTrack ? 0.22 : 0.16)), trackY, 0]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[dualTrack ? 0.5 : 0.42, 0.52, l * 0.98]} />
            <meshStandardMaterial
              ref={si === 0 ? trackMatL : trackMatR}
              map={trackTex}
              color="#b0b0b0"
              metalness={0.12}
              roughness={0.94}
            />
          </mesh>
          <mesh position={[side * -0.12, 0.02, 0]}>
            <boxGeometry args={[0.2, 0.38, l * 0.9]} />
            <meshStandardMaterial color="#1a1c18" roughness={0.95} />
          </mesh>
          {Array.from({ length: dualTrack ? 6 : 5 }, (_, i) => (
            <mesh
              key={i}
              ref={(el) => {
                wheelRefs.current[si * 6 + i] = el;
              }}
              position={[
                side * 0.08,
                -0.08,
                -l * 0.38 + i * ((l * 0.76) / (dualTrack ? 5 : 4)),
              ]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.13, 0.13, 0.15, 10]} />
              <meshStandardMaterial color="#3a3c36" metalness={0.35} roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function weaponFamily(w: WeaponPart): "assault" | "missile" | "sniper" | "mortar" | "other" {
  if (w.weaponType === "mortar") return "mortar";
  if (w.id === "weapon_craterfall" || w.id.includes("missile")) return "missile";
  if (w.weaponType === "assault") return "assault";
  if (
    w.id === "weapon_ionthread" ||
    w.id === "weapon_starweft" ||
    w.id === "weapon_stonebreaker" ||
    (w.weaponType === "plasma" && w.range >= 150)
  )
    return "sniper";
  return "other";
}

/** Turret ring + gun unique to weapon (not part of chassis) */
export function WeaponMount({
  weapon,
  chassis,
  turretRef,
  barrelRef,
  muzzleRef,
}: {
  weapon: WeaponPart;
  chassis: ChassisPart;
  turretRef: RefObject<THREE.Group | null>;
  barrelRef: RefObject<THREE.Mesh | null>;
  muzzleRef: RefObject<THREE.Object3D | null>;
}) {
  const [w, h, l] = chassis.size;
  const fam = weaponFamily(weapon);
  const mountY = h / 2 + 0.18;

  const holderColor = "#4a5344";
  const gunColor = "#2e342e";

  if (fam === "assault") {
    return (
      <group ref={turretRef} position={[0, mountY, -0.05]}>
        {/* Cuboidal turret holder */}
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.42, 0.95]} />
          <meshStandardMaterial color={holderColor} metalness={0.25} roughness={0.7} />
        </mesh>
        {/* Dual cuboidal barrels */}
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * 0.18, 0.06, -l * 0.28]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, l * 0.42, 0.12]} />
            <meshStandardMaterial color={gunColor} metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {/* Joining cylinder / muzzle */}
        <mesh
          ref={barrelRef}
          position={[0, 0.06, -l * 0.48]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.12, 0.28, 10]} />
          <meshStandardMaterial color="#1a1e1a" metalness={0.5} roughness={0.45} />
        </mesh>
        <object3D ref={muzzleRef} position={[0, 0.06, -l * 0.62]} />
      </group>
    );
  }

  if (fam === "missile") {
    return (
      <group ref={turretRef} position={[0, mountY, -0.05]}>
        {/* Larger holder */}
        <mesh castShadow>
          <boxGeometry args={[1.25, 0.5, 1.15]} />
          <meshStandardMaterial color={holderColor} metalness={0.2} roughness={0.75} />
        </mesh>
        {/* Irregular octagon pod (elongated front-back) */}
        <mesh position={[0, 0.15, -0.35]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.35, 8]} />
          <meshStandardMaterial color="#3a4038" metalness={0.3} roughness={0.65} />
        </mesh>
        <mesh
          ref={barrelRef}
          position={[0, 0.15, -0.75]}
          scale={[1.15, 1, 1.4]}
          castShadow
        >
          <cylinderGeometry args={[0.4, 0.4, 0.45, 8]} />
          <meshStandardMaterial color="#2a2e28" metalness={0.35} roughness={0.6} />
        </mesh>
        {/* Tube tips */}
        {([-0.2, 0.2] as const).map((x, i) =>
          ([-0.15, 0.15] as const).map((y, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0.15 + y * 0.3, -1.05]} castShadow>
              <cylinderGeometry args={[0.06, 0.07, 0.35, 6]} />
              <meshStandardMaterial color="#1a1a18" />
            </mesh>
          ))
        )}
        <object3D ref={muzzleRef} position={[0, 0.15, -1.25]} />
      </group>
    );
  }

  if (fam === "sniper") {
    const len = l * 0.85;
    return (
      <group ref={turretRef} position={[0, mountY, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.85, 0.4, 1.0]} />
          <meshStandardMaterial color={holderColor} metalness={0.25} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.12, 0.15]} castShadow>
          <boxGeometry args={[0.35, 0.2, 0.4]} />
          <meshStandardMaterial color="#5a6352" />
        </mesh>
        <mesh
          ref={barrelRef}
          position={[0, 0.05, -len * 0.45]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.07, 0.1, len, 10]} />
          <meshStandardMaterial color={gunColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, -len * 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.2, 8]} />
          <meshStandardMaterial color="#1a1e1a" />
        </mesh>
        <object3D ref={muzzleRef} position={[0, 0.05, -len * 0.95]} />
      </group>
    );
  }

  if (fam === "mortar") {
    return (
      <group ref={turretRef} position={[0, mountY, 0]}>
        {/* Artillery rack base */}
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.35, 1.1]} />
          <meshStandardMaterial color={holderColor} metalness={0.2} roughness={0.8} />
        </mesh>
        {/* Elevated rack */}
        <mesh position={[0, 0.35, 0.1]} rotation={[-0.4, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 0.2, 0.9]} />
          <meshStandardMaterial color="#3a4038" />
        </mesh>
        {/* Tube cluster */}
        {([-0.35, 0, 0.35] as const).map((x, i) => (
          <mesh
            key={i}
            ref={i === 1 ? barrelRef : undefined}
            position={[x, 0.55, -0.15]}
            rotation={[-0.85, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.12, 1.1, 8]} />
            <meshStandardMaterial color={gunColor} metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        <object3D ref={muzzleRef} position={[0, 1.05, -0.75]} />
      </group>
    );
  }

  // Default cannon-style
  return (
    <group ref={turretRef} position={[0, mountY, -0.05]}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.48, 1.2]} />
        <meshStandardMaterial color={holderColor} metalness={0.22} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.06, -0.5]} castShadow>
        <boxGeometry args={[0.5, 0.36, 0.3]} />
        <meshStandardMaterial color="#4a5344" />
      </mesh>
      <mesh
        ref={barrelRef}
        position={[0, 0.06, -l * 0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.09, 0.12, l * 0.55, 10]} />
        <meshStandardMaterial color={gunColor} metalness={0.45} roughness={0.5} />
      </mesh>
      <object3D ref={muzzleRef} position={[0, 0.06, -l * 0.68]} />
    </group>
  );
}

export function useTrackTexture() {
  return useMemo(() => makeTrackTexture(), []);
}
