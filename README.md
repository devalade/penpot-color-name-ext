#Penpot Color Name Extension

A Penpot extension that helps designers instantly identify color names and suggests 4 similar color variants, making color selection effortless.

## Features

- 🎨 Instantly identify names for any selected color
- 🔍 Get 4 suggested color variants closest to your selection
- ⚡ Fast and lightweight implementation
- 🎯 Seamless Penpot integration

## Installation

1. Clone this repository:
```bash
git clone https://github.com/devalade/penpot-color-name-ext.git
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
pnpm run build
```

4. Enable developer mode in Penpot settings

5. Load the extension from the dist folder

## Development

### Prerequisites

- Node.js  20.11.0+
- npm
- Penpot running locally or access to Penpot instance

### Project Structure

```
src/
  ├── assets/
  │   ├── main.css
  │   └── penpot.css
  ├── lib/
  │   ├── color-utils.ts
  │   ├── color-utils.test.ts
  │   └── types.ts
  ├── App.svelte
  ├── plugin.svelte
  ├── types.svelte
  └── main.ts
```

### Getting Started

1. Run development server:
```bash
pnpm run dev
```

2. Make changes in `src` directory
3. Test your changes in your web browser and Penpot
4. Build for production when ready

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

You can use this function to simulate the color name generation:

```ts
// Copy and paste this function in the App.svelte file
function simulateColorChange() {
    const data = [
      {
        color: "#FF0000",
        name: "Red",
      },
      {
        color: "#00FF00",
        name: "Green",
      },
      {
        color: "#0000FF",
        name: "Blue",
      },
    ];
    variants.value = data.reduce(
      (acc, item) => ({
        ...acc,
        [item.color]: findContrastVariations(item.color, colorMap, colornames),
      }),
      {},
    );
  }
```

### Code Style

- Use TypeScript
- Follow Svelte best practices
- Write unit tests for new features
- Update documentation as needed

## License

MIT License - see LICENSE file for details

## Contact

- Create an issue for bug reports
- Submit PRs for contributions
- Join our Discord community

## Acknowledgments

- Penpot team for the amazing platform
- Color naming libraries contributors
- Svelte team for v5 improvements

---

Follow [@dev_alade](https://x.com/dev_alade) for updates.

Built with ❤️ by devalade
