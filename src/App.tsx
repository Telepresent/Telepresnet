import React, {
  Suspense,
  useMemo,
  useCallback,
  useEffect,
  useRef
} from "react";
import {
  Canvas,
  useLoader,
  useUpdate,
  useThree,
  useFrame
} from "react-three-fiber";
import { Plane, useAspect, Stats } from "drei";
import { TextureLoader, Shape, ShapeBufferGeometry, Group } from "three";
import { useSpring, a } from "react-spring/three";
import { useGesture } from "react-use-gesture";
import { UseGestureConfig } from "react-use-gesture/dist/types";
import clamp from "lodash/clamp";
import { Flex, Box, useFlexInvalidate } from "./react-three-flex";

function Postcard({
  i = 0,
  width = 150,
  height = 100,
  padding = 20,
  resolution = 4,
  borderRadius = 5,
  id = "",
  ...rest
}) {
  const texture = useLoader(
    TextureLoader,
    `https://picsum.photos/id/${id}/${width * resolution}/${
      height * resolution
    }`
  );

  const shape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, borderRadius);
    shape.lineTo(0, height - borderRadius);
    shape.quadraticCurveTo(0, height, borderRadius, height);
    shape.lineTo(width - borderRadius, height);
    shape.quadraticCurveTo(width, height, width, height - borderRadius);
    shape.lineTo(width, borderRadius);
    shape.quadraticCurveTo(width, 0, width - borderRadius, 0);
    shape.lineTo(borderRadius, 0);
    shape.quadraticCurveTo(0, 0, 0, borderRadius);
    return shape;
  }, [width, height, borderRadius]);
  const geomRef = useUpdate<ShapeBufferGeometry>(
    (geometry) => void geometry.center(),
    [shape]
  );

  const invalidate = useFlexInvalidate();
  useEffect(invalidate, [invalidate, texture, width, height, padding]);

  const groupRef = useRef<Group>();
  useFrame(({ clock }) => {
    if (i % 4 === 0) {
      groupRef.current.scale.x = 1 + Math.sin(clock.getElapsedTime()) * 0.8;
      invalidate();
    }
  });
  return (
    <group ref={groupRef} {...rest}>
      <Plane
        args={[width - padding, height - padding]}
        position={[0, 0, 10]}
        castShadow
      >
        <meshStandardMaterial map={texture} roughness={0.5} />
      </Plane>
      <mesh position={[0, 0, 8]} castShadow receiveShadow>
        <shapeBufferGeometry args={[shape]} ref={geomRef} />
        <meshStandardMaterial color="white" roughness={0.5} />
      </mesh>
    </group>
  );
}

function useYScroll(bounds: [number, number], props: UseGestureConfig) {
  const [{ y }, set] = useSpring(() => ({ y: 0 }));
  const fn = useCallback(
    ({ xy: [, cy], previous: [, py], memo = y.getValue() }) => {
      const newY = clamp(memo + cy - py, ...bounds);
      set({ y: newY });
      return newY;
    },
    [bounds, y, set]
  );
  const bind = useGesture({ onWheel: fn, onDrag: fn }, props);
  useEffect(() => props && props.domTarget && bind(), [props, bind]);
  return [y, bind];
}

function Expo() {
  const imageIds = useMemo(
    () => new Array(50).fill(0).map((k, i) => (i + 30).toString()),
    []
  );

  const { size } = useThree();
  const [vpWidth, vpHeight] = useAspect("cover", size.width, size.height);
  const expectedTilesPerRow = Math.floor(vpWidth / 160);
  const maxY = Math.floor(imageIds.length / expectedTilesPerRow) * 110;
  const [y] = useYScroll([0, maxY * 2], { domTarget: window });
  // useFrame(() => console.log('scrolled', y.getValue()))

  return (
    <group rotation={[-0.4, 0, 0]}>
      <a.group position-y={y.interpolate((y) => y * 0.5 + vpHeight / 4)}>
        <Flex
          mainAxis="x"
          crossAxis="y"
          flexDirection="row"
          flexWrap="wrap"
          justify="center"
          // justify="space-between"
          alignItems="center"
          size={[vpWidth, 0, 0]}
        >
          {imageIds.map((id, i) => (
            <Box key={`${i}-${id}`} margin={5}>
              <Postcard id={id} i={i} />
            </Box>
          ))}
        </Flex>
      </a.group>
    </group>
  );
}

export default function App() {
  return (
    <Canvas
      colorManagement
      pixelRatio={window.devicePixelRatio}
      gl={{ alpha: false }}
      camera={{ position: [0, 0, 200], near: 120, far: 300 }}
    >
      <pointLight position={[0, 100, 400]} />
      <ambientLight intensity={0.2} />

      <Suspense fallback={null}>
        <Expo />
      </Suspense>

      <Stats />
    </Canvas>
  );
}
