import React, {
  useLayoutEffect,
  useContext,
  useRef,
  useState,
  useMemo,
  PropsWithChildren
} from "react";
import * as THREE from "three";
import Yoga from "yoga-layout-prebuilt";
import { ReactThreeFiber } from "react-three-fiber";
import { setYogaProperties, rmUndefFromObj } from "./util";
import { boxContext, flexContext } from "./context";
import { R3FlexProps } from "./props";

/**
 * Box container for 3D Objects.
 * For containing Boxes use `<Flex />`.
 */
export function Box({
  // Non-flex props
  children,

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
  padding,

  height,
  width,

  maxHeight,
  maxWidth,
  minHeight,
  minWidth,

  // other
  ...props
}: PropsWithChildren<
  R3FlexProps & ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
>) {
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
      padding,

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
    margin,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    width,
    wrap
  ]);

  const { rootNode, registerBox, unregisterBox } = useContext(flexContext);
  const parent = useContext(boxContext) || rootNode;
  const group = useRef<THREE.Group>();
  const [node] = useState(() => Yoga.Node.create());

  useLayoutEffect(() => {
    setYogaProperties(node, flexProps);
  }, [flexProps, node]);

  // Make child known to the parents yoga instance *before* it calculates layout
  useLayoutEffect(() => {
    parent.insertChild(node, parent.getChildCount());
    registerBox(group.current, node);

    // Remove child on unmount
    return () => {
      parent.removeChild(node);
      unregisterBox(group.current, node);
    };
  }, [node, parent]);

  return (
    <group ref={group} {...props}>
      <boxContext.Provider value={node}>{children}</boxContext.Provider>
    </group>
  );
}
