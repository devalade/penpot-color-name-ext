declare module 'color-name-list' {
  interface Color {
    name: string;
    hex: string;
  }

  export const colornames: Color[];
}
