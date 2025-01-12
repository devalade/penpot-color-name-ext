/**
 * This file contains the typescript interfaces for the plugin events.
 */

export interface ThemePluginEvent {
  type: string;
  content: string;
}

export type PluginMessageEvent = ThemePluginEvent;

export interface ColorShape {
  color: string;
  opacity: number;
  shapeInfo: {
    property: string;
    index: number;
    shapeId: string;
  }[];
};
