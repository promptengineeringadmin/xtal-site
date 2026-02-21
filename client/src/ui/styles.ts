export function generateCSS(): string {
  return `
    :host {
      --xtal-bg: #ffffff;
      --xtal-text: #1a1a1a;
      --xtal-text-muted: #64748b;
      --xtal-border: #e2e8f0;
      --xtal-accent: #4f46e5;
      --xtal-accent-hover: #4338ca;
      --xtal-card-bg: #ffffff;
      --xtal-card-shadow: 0 1px 3px rgba(0,0,0,0.1);
      --xtal-overlay-bg: rgba(0,0,0,0.5);
      --xtal-radius: 12px;
      --xtal-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .xtal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--xtal-overlay-bg);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 80px;
      font-family: var(--xtal-font);
      overflow-y: auto;
    }

    .xtal-container {
      background: var(--xtal-bg);
      border-radius: var(--xtal-radius);
      width: 90%;
      max-width: 900px;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }

    .xtal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--xtal-border);
      position: sticky;
      top: 0;
      background: var(--xtal-bg);
      z-index: 1;
    }

    .xtal-header-query {
      font-size: 14px;
      font-weight: 600;
      color: var(--xtal-text);
    }

    .xtal-header-meta {
      font-size: 12px;
      color: var(--xtal-text-muted);
    }

    .xtal-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: var(--xtal-text-muted);
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1;
    }
    .xtal-close:hover {
      background: #f1f5f9;
      color: var(--xtal-text);
    }

    .xtal-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--xtal-border);
    }

    .xtal-chip {
      background: #f1f5f9;
      border: 1px solid var(--xtal-border);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      color: var(--xtal-text);
      cursor: pointer;
      transition: all 0.15s;
      font-family: var(--xtal-font);
    }
    .xtal-chip:hover {
      border-color: var(--xtal-accent);
      color: var(--xtal-accent);
    }
    .xtal-chip-selected {
      background: var(--xtal-accent);
      border-color: var(--xtal-accent);
      color: #ffffff;
    }
    .xtal-chip-selected:hover {
      background: var(--xtal-accent-hover);
      color: #ffffff;
    }

    .xtal-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 20px;
    }

    .xtal-card {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--xtal-border);
      background: var(--xtal-card-bg);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .xtal-card:hover {
      box-shadow: var(--xtal-card-shadow);
      transform: translateY(-2px);
    }

    .xtal-card-image {
      aspect-ratio: 1;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .xtal-card-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }
    .xtal-card-image-placeholder {
      color: var(--xtal-text-muted);
      font-size: 12px;
    }

    .xtal-card-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .xtal-card-vendor {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--xtal-text-muted);
      font-weight: 500;
    }

    .xtal-card-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--xtal-text);
      margin-top: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .xtal-card-price {
      font-size: 13px;
      font-weight: 600;
      color: var(--xtal-text);
      margin-top: auto;
      padding-top: 8px;
    }

    .xtal-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--xtal-text-muted);
      font-size: 14px;
      gap: 8px;
    }

    .xtal-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--xtal-border);
      border-top-color: var(--xtal-accent);
      border-radius: 50%;
      animation: xtal-spin 0.6s linear infinite;
    }

    @keyframes xtal-spin {
      to { transform: rotate(360deg); }
    }

    .xtal-empty {
      text-align: center;
      padding: 60px 20px;
      color: var(--xtal-text-muted);
      font-size: 14px;
    }

    .xtal-powered {
      text-align: center;
      padding: 12px;
      font-size: 10px;
      color: var(--xtal-text-muted);
      border-top: 1px solid var(--xtal-border);
    }

    @media (max-width: 768px) {
      .xtal-backdrop {
        padding-top: 0;
        align-items: stretch;
      }
      .xtal-container {
        width: 100%;
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }
      .xtal-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 12px;
      }
    }
  `
}
