import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TankBlueprint, getPart, ChassisPart, WeaponPart } from "../../data/parts";
import { ChassisHull, WeaponMount } from "./TankVisuals";
import { makeTrackTexture } from "../../game/visuals";

interface Props {
  blueprint: TankBlueprint;
}

export function TankPreview({ blueprint }: Props) {
  const chassis = getPart<ChassisPart>(blueprint.chassisId)!;
  const weapon = getPart<WeaponPart>(blueprint.weaponId)!;
  const trackMatL = useRef<THREE.MeshStandardMaterial>(null);
  const trackMatR = useRef<THREE.MeshStandardMaterial>(null);
  const turretRef = useRef<THREE.Group>(null);
  const barrelRef = useRef<THREE.Mesh>(null);
  const muzzleRef = useRef<THREE.Object3D>(null);
  const wheelRefs = useRef<(THREE.Mesh | null)[]>([]);
  const trackTex = useMemo(() => makeTrackTexture(), []);

  return (
    <group position={[0, 0.4, 0]}>
      <ChassisHull
        chassis={chassis}
        trackMatL={trackMatL}
        trackMatR={trackMatR}
        trackTex={trackTex}
        wheelRefs={wheelRefs}
      />
      <WeaponMount
        weapon={weapon}
        turretRef={turretRef}
        barrelRef={barrelRef}
        muzzleRef={muzzleRef}
      />
    </group>
  );
}
