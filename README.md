# @devenma/astro-bottomsheet

🎯 Draggable bottom sheet / drawer component for Astro with TypeScript support.

Perfect for creating mobile-friendly bottom drawers, side panels, or modal-like interfaces with smooth drag interactions.

## ✨ Features

- ✅ **Fully Responsive**: Mobile (vertical drag) and Desktop (horizontal drag) optimized
- ✅ **TypeScript Native**: Full type safety and autocomplete
- ✅ **Framework Agnostic Core**: Use the vanilla JS/TS core in any framework
- ✅ **Astro Components**: Pre-built components with declarative API
- ✅ **Customizable**: Easy theming with color props
- ✅ **Accessible**: Keyboard and screen reader friendly
- ✅ **Zero Dependencies**: Lightweight and performant
- ✅ **Event System**: Rich custom events for integration

## 📦 Installation

```bash
npm install @devenma/astro-bottomsheet
```

```bash
pnpm add @devenma/astro-bottomsheet
```

```bash
yarn add @devenma/astro-bottomsheet
```

## 🚀 Quick Start

### 1. Basic Usage (Astro Components)

```astro
---
import BottomSheet from '@devenma/astro-bottomsheet/components';
---

<BottomSheet sections={3} />
```

### 2. With Trigger Component (Declarative)

```astro
---
import BottomSheet from '@devenma/astro-bottomsheet/components';
import BottomSheetTrigger from '@devenma/astro-bottomsheet/components/trigger';
---

<BottomSheet sections={3} />

<BottomSheetTrigger title="Product Details">
  <button data-trigger>View Details</button>

  <div data-section="0" hidden>
    <h3>Description</h3>
    <p>Product description here...</p>
  </div>

  <div data-section="1" hidden>
    <h3>Specifications</h3>
    <ul>
      <li>Feature 1</li>
      <li>Feature 2</li>
    </ul>
  </div>
</BottomSheetTrigger>
```

### 3. Programmatic API

```typescript
import { getBottomSheet } from "@devenma/astro-bottomsheet/instance";

const bs = getBottomSheet();
bs?.open();
bs?.setTitle("Dynamic Title");
bs?.setSectionContent(0, "<p>Dynamic content</p>");
```

### 4. Vanilla JS/TS (Framework Agnostic)

```typescript
import BottomSheet from "@devenma/astro-bottomsheet/core";

const bottomSheet = new BottomSheet("#bottomsheet");
bottomSheet.open();
bottomSheet.setTitle("Hello World");
```

## 🎨 Theming

Customize colors with props:

```astro
<BottomSheet
  baseColor="#1e293b"
  textColor="#f1f5f9"
  borderColor="#334155"
  sections={3}
/>
```

## 📚 API Reference

### BottomSheet Component Props

| Prop          | Type     | Default     | Description                |
| ------------- | -------- | ----------- | -------------------------- |
| `sections`    | `number` | `3`         | Number of content sections |
| `baseColor`   | `string` | `"#ffffff"` | Background color           |
| `textColor`   | `string` | `"#0f172a"` | Text color                 |
| `borderColor` | `string` | `"#e2e8f0"` | Border color               |
| `class`       | `string` | `""`        | Additional CSS classes     |

### BottomSheetTrigger Props

| Prop    | Type     | Default  | Description              |
| ------- | -------- | -------- | ------------------------ |
| `title` | `string` | Required | Title displayed in panel |
| `class` | `string` | `""`     | Additional CSS classes   |

### Instance Methods

```typescript
// Opening and closing
open(): void
close(): void
minimize(): void
maximize(): void

// Content management
setTitle(title: string): void
setSectionContent(index: number, content: string | HTMLElement): void
clearSection(index: number): void
clearAllSections(): void

// Error handling
showError(message?: string): void
hideError(): void

// State queries
isOpen(): boolean
isMinimized(): boolean
isMaximized(): boolean
hasMoved(): boolean
```

### Events

Listen to custom events:

```typescript
import { getBottomSheet } from "@devenma/astro-bottomsheet/instance";

const bs = getBottomSheet();

// Listen to events
document.addEventListener("bottomsheet:open", (e) => {
  console.log("Panel opened", e.detail);
});

document.addEventListener("bottomsheet:close", (e) => {
  console.log("Panel closed", e.detail);
});

// Available events:
// - bottomsheet:open
// - bottomsheet:close
// - bottomsheet:minimized
// - bottomsheet:maximized
// - bottomsheet:dragging
// - bottomsheet:section-updated
```

## 🔧 Advanced Usage

### Dynamic Content Loading

```typescript
import { getBottomSheet } from "@devenma/astro-bottomsheet/instance";

async function loadProductDetails(productId: string) {
  const bs = getBottomSheet();
  if (!bs) return;

  bs.open();
  bs.setTitle("Loading...");

  try {
    const response = await fetch(`/api/products/${productId}`);
    const data = await response.json();

    bs.setTitle(data.name);
    bs.setSectionContent(
      0,
      `
      <img src="${data.image}" alt="${data.name}" />
      <h3>${data.name}</h3>
      <p>${data.description}</p>
    `
    );
  } catch (error) {
    bs.showError("Failed to load product details");
  }
}
```

### Multiple Triggers

```astro
---
import BottomSheet from '@devenma/astro-bottomsheet/components';
import BottomSheetTrigger from '@devenma/astro-bottomsheet/components/trigger';

const products = [
  { id: 1, name: 'Product A', description: '...' },
  { id: 2, name: 'Product B', description: '...' },
];
---

<BottomSheet sections={2} />

{products.map(product => (
  <BottomSheetTrigger title={product.name}>
    <div data-trigger class="product-card">
      <h3>{product.name}</h3>
    </div>

    <div data-section="0" hidden>
      <p>{product.description}</p>
    </div>
  </BottomSheetTrigger>
))}
```

## 🎯 Examples

Check out the [examples directory](./examples) for more use cases:

- Simple button trigger
- Card-based triggers
- Dynamic content loading
- Custom styling
- Multiple panels

## 📱 Behavior

### Mobile (< 768px)

- Draggable vertically
- Full width
- Minimizes downward

### Desktop (≥ 768px)

- Draggable horizontally
- Configurable width (default 33.333%)
- Minimizes to the right

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Enmanuel Rosales Leon

## 🔗 Links

- [GitHub Repository](https://github.com/devenma/astro-bottomsheet)
- [Report Issues](https://github.com/devenma/astro-bottomsheet/issues)
- [NPM Package](https://www.npmjs.com/package/@devenma/astro-bottomsheet)

## 💡 Inspiration

Built with ❤️ for the Astro community. Originally created for the [ChocolateButter](https://github.com/devenma/chocolatebutter) project.
