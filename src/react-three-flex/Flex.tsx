import React, {
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  PropsWithChildren,
  useRef
} from "react";
import Yoga, { YogaNode } from "yoga-layout-prebuilt";
import { Vector3, Group, Box3 } from "three";
import { setYogaProperties, rmUndefFromObj, vectorFromObject } from "./util";

import { boxContext, flexContext } from "./context";

import { Axis } from "./util";
import { R3FlexProps } from "./props";
import { useFrame, useThree } from "react-three-fiber";

export function useFlexInvalidate() {
  const { flexInvalidate } = useContext(flexContext);
  return flexInvalidate;
}

export type FlexYogaDirection = Yoga.YogaDirection | "ltr" | "rtl";

type FlexProps = PropsWithChildren<
  Partial<{
    /**
     * Root container position
     */
    position: [number, number, number];
    size: [number, number, number];
    yogaDirection: FlexYogaDirection;
    mainAxis: Axis;
    crossAxis: Axis;
  }> &
    R3FlexProps
>;

/**
 * Flex container. Can contain Boxes or other Flexes
 */
export function Flex({
  // Non flex props
  size = [1, 1, 1],
  yogaDirection = "ltr",
  mainAxis = "x",
  crossAxis = "y",
  children,
  position = [0, 0, 0],

  // flex props

  flexDirection,
  flexDir,
  dir,

  alignContent,
  alignItems,
  alignSelf,
  align,

  justifyContent,
  justify,

  flexBasis,
  flexGrow,
  flexShrink,

  flexWrap,
  wrap,

  margin,
  m,
  marginBottom,
  marginLeft,
  marginRight,
  marginTop,
  mb,
  ml,
  mr,
  mt,

  padding,
  p,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingTop,
  pb,
  pl,
  pr,
  pt,

  height,
  width,

  maxHeight,
  maxWidth,
  minHeight,
  minWidth,

  // other
  ...props
}: FlexProps) {
  // must memoize or the object literal will cause every dependent of flexProps to rerender everytime
  const flexProps: R3FlexProps = useMemo(() => {
    const _flexProps = {
      flexDirection,
      flexDir,
      dir,

      alignContent,
      alignItems,
      alignSelf,
      align,

      justifyContent,
      justify,

      flexBasis,
      flexGrow,
      flexShrink,

      flexWrap,
      wrap,

      margin,
      m,
      marginBottom,
      marginLeft,
      marginRight,
      marginTop,
      mb,
      ml,
      mr,
      mt,

      padding,
      p,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingTop,
      pb,
      pl,
      pr,
      pt,

      height,
      width,

      maxHeight,
      maxWidth,
      minHeight,
      minWidth
    };

    rmUndefFromObj(_flexProps);
    return _flexProps;
  }, [
    align,
    alignContent,
    alignItems,
    alignSelf,
    dir,
    flexBasis,
    flexDir,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    height,
    justify,
    justifyContent,
    m,
    margin,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    maxHeight,
    maxWidth,
    mb,
    minHeight,
    minWidth,
    ml,
    mr,
    mt,
    p,
    padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    pb,
    pl,
    pr,
    pt,
    width,
    wrap
  ]);

  const [rootNode] = useState(() => Yoga.Node.create());
  useLayoutEffect(() => {
    setYogaProperties(rootNode, flexProps);
  }, [rootNode, flexProps]);

  const dirtyRef = useRef(false);
  const flexInvalidate = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const boxesRef = useRef<{ group: Group; node: YogaNode }[]>([]);
  const registerBox = useCallback((group: Group, node: YogaNode) => {
    const i = boxesRef.current.findIndex(
      (b) => b.group === group && b.node === node
    );
    if (i !== -1) {
      boxesRef.current.splice(i, 1);
    }

    boxesRef.current.push({ group, node });
  }, []);
  const unregisterBox = useCallback((group: Group, node: YogaNode) => {
    const i = boxesRef.current.findIndex(
      (b) => b.group === group && b.node === node
    );
    if (i !== -1) {
      boxesRef.current.splice(i, 1);
    }
  }, []);

  const state = useMemo(() => {
    const sizeVec3 = new Vector3(...size);
    const depthAxis = ["x", "y", "z"].find(
      (axis) => ![mainAxis, crossAxis].includes(axis as Axis)
    );
    const flexWidth = sizeVec3[mainAxis];
    const flexHeight = sizeVec3[crossAxis];
    const rootStart = new Vector3(...position).addScaledVector(
      new Vector3(size[0], size[1], size[2]),
      0.5
    );
    const yogaDirection_ =
      yogaDirection === "ltr"
        ? Yoga.DIRECTION_LTR
        : yogaDirection === "rtl"
        ? Yoga.DIRECTION_RTL
        : yogaDirection;
    return {
      rootNode,
      depthAxis,
      mainAxis,
      crossAxis,
      sizeVec3,
      flexWidth,
      flexHeight,
      rootStart,
      yogaDirection: yogaDirection_,
      flexInvalidate,
      registerBox,
      unregisterBox
    };
  }, [
    rootNode,
    mainAxis,
    crossAxis,
    position,
    size,
    flexInvalidate,
    registerBox,
    unregisterBox
  ]);

  const { invalidate } = useThree();
  useFrame(() => {
    if (dirtyRef.current) {
      const boundingBox = new Box3();
      const vec = new Vector3();

      // Recalc all the sizes
      boxesRef.current.forEach(({ group, node }) => {
        boundingBox.setFromObject(group).getSize(vec);
        node.setWidth(vec[mainAxis]);
        node.setHeight(vec[crossAxis]);
      });

      // Perform yoga layout calculation
      rootNode.calculateLayout(
        state.flexWidth,
        state.flexHeight,
        state.yogaDirection
      );

      // Reposition after recalculation
      boxesRef.current.forEach(({ group, node }) => {
        const { left, top, width, height } = node.getComputedLayout();
        const position = vectorFromObject({
          [state.mainAxis]:
            -state.rootStart[state.mainAxis] + (left + width / 2),
          [state.crossAxis]:
            state.rootStart[state.crossAxis] - (+top + height / 2),
          [state.depthAxis]:
            state.rootStart[state.depthAxis] -
            state.sizeVec3[state.depthAxis] / 2
        } as any);
        group.position.copy(position);
        invalidate();
      });
    }
  });

  return (
    <group position={position} {...props}>
      <boxContext.Provider value={null}>
        <flexContext.Provider value={state}>{children}</flexContext.Provider>
      </boxContext.Provider>
    </group>
  );
}
