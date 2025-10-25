# FontMesa Marlin Font Integration

This directory contains the font files for FontMesa Marlin, which is the primary typeface for the CADMonkey application.

## Font Files Required

To complete the font integration, you need to add the following font files to this directory:

- `FontMesa-Marlin-Regular.woff2`
- `FontMesa-Marlin-Regular.woff`
- `FontMesa-Marlin-Regular.ttf`
- `FontMesa-Marlin-Medium.woff2`
- `FontMesa-Marlin-Medium.woff`
- `FontMesa-Marlin-Medium.ttf`
- `FontMesa-Marlin-SemiBold.woff2`
- `FontMesa-Marlin-SemiBold.woff`
- `FontMesa-Marlin-SemiBold.ttf`
- `FontMesa-Marlin-Bold.woff2`
- `FontMesa-Marlin-Bold.woff`
- `FontMesa-Marlin-Bold.ttf`

## Font Weights

- **Regular (400)**: Used for body text and general UI elements
- **Medium (500)**: Used for emphasized text and buttons
- **SemiBold (600)**: Used for headings and important labels
- **Bold (700)**: Used for main titles and strong emphasis

## Fallback Fonts

The CSS includes fallback fonts in case FontMesa Marlin is not available:
- `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`

## Usage

The font is automatically loaded via the `font-face.css` file and applied through CSS custom properties:

```css
font-family: var(--font-primary);
```

## License

Please ensure you have the proper license to use FontMesa Marlin in your application.
