import { createContext } from "react";
import { YogaNode } from "yoga-layout-prebuilt";
import { Axis } from "./util";
import { Vector3, Group } from "three";
import { FlexYogaDirection } from "./Flex";

export const flexContext = createContext<{
  rootNode: YogaNode;
  depthAxis: string;
  mainAxis: Axis;
  crossAxis: Axis;
  sizeVec3: Vector3;
  flexWidth: number;
  flexHeight: number;
  rootStart: Vector3;
  yogaDirection: FlexYogaDirection;
  flexInvalidate(): void;
  registerBox(group: Group, node: YogaNode): void;
  unregisterBox(group: Group, node: YogaNode): void;
}>(null);

export const boxContext = createContext<YogaNode>(null);
