import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
  props: {
    [x: string]: any;
    pixels: string[][];
    asImage?: boolean | undefined;
    gridShown?: boolean | undefined;
  };
  events: {
    focus: FocusEvent;
    blur: FocusEvent;
  } & {
    [evt: string]: CustomEvent<{ x: number; y: number; color: string }>;
    [evt: "save"]: string;
  };
  slots: {};
};
export type PixelViewProps = typeof __propDef.props;
export type PixelViewEvents = typeof __propDef.events;
export type PixelViewSlots = typeof __propDef.slots;
export default class PixelView extends SvelteComponentTyped<
  PixelViewProps,
  PixelViewEvents,
  PixelViewSlots
> {}
export {};
