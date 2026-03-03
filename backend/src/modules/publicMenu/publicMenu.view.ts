import { PublicMenuViewModel } from './publicMenu.service';

function formatPriceBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

function resolveImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return image;
  // Garante que caminhos como "uploads/xyz.jpg" virem "/uploads/xyz.jpg"
  return `/${image.replace(/^\/+/, '')}`;
}

export function renderPublicMenuHtml(viewModel: PublicMenuViewModel): string {
  const { store, categories } = viewModel;

  const hasCategories = categories.length > 0;

  const categoriesHtml = hasCategories
    ? categories
        .map((category) => {
          if (!category.products.length) {
            return '';
          }

          const productsHtml = category.products
            .map((product) => {
              const imageUrl = resolveImageUrl(product.image);
              return `
                <div class="product-card">
                  <div class="product-info">
                    <div class="product-header">
                      <h3 class="product-name">${product.name}</h3>
                      <span class="product-price">${formatPriceBRL(product.price)}</span>
                    </div>
                    ${
                      product.description
                        ? `<p class="product-description">${product.description}</p>`
                        : ''
                    }
                  </div>
                  ${
                    imageUrl
                      ? `<div class="product-image-wrapper">
                          <img src="${imageUrl}" alt="${product.name}" class="product-image" />
                        </div>`
                      : ''
                  }
                </div>
              `;
            })
            .join('');

          return `
            <section class="category-section">
              <h2 class="category-title">${category.name}</h2>
              <div class="category-products">
                ${productsHtml}
              </div>
            </section>
          `;
        })
        .join('')
    : `
      <div class="empty-state">
        <p>Não há produtos disponíveis no cardápio público no momento.</p>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Cardápio - ${store.name}</title>
        <style>
          :root {
            --element-blue-neon: #00CFFF;
            --element-blue-dark: #1A374D;
            --element-gray-light: #E6E8E6;
            --element-white: #FFFFFF;
            --element-gray-dark: #2D2D2D;

            --primary-color: var(--element-blue-dark);
            --accent-color: var(--element-blue-neon);
            --text-color: #111827;
            --muted-text-color: #6b7280;
            --border-color: var(--element-gray-light);
            --background-color: #f3f4f6;
            --card-background: var(--element-white);
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--text-color);
            background-color: var(--background-color);
          }

          body {
            -webkit-font-smoothing: antialiased;
          }

          .page {
            max-width: 960px;
            margin: 24px auto 40px;
            padding: 24px 24px 32px;
            background: var(--card-background);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            box-shadow:
              0 18px 40px rgba(15, 23, 42, 0.08);
          }

          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background-color: #ffffff;
            }

            .page {
              max-width: none;
              margin: 0;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
              border: none;
              background: #ffffff;
            }

            .pdf-hint {
              display: none !important;
            }
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 18px;
          }

          .header-main {
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 0;
          }

          .logo-wrapper {
            flex-shrink: 0;
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, var(--element-blue-neon), var(--element-blue-dark));
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow:
              0 0 0 1px rgba(15, 23, 42, 0.18),
              0 10px 24px rgba(15, 23, 42, 0.28);
          }

          .logo-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .logo-placeholder {
            color: #fef2f2;
            font-weight: 700;
            font-size: 20px;
          }

          .store-info {
            flex: 1;
            min-width: 0;
          }

          .store-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 0 0 4px;
            color: var(--primary-color);
          }

          .store-subtitle {
            margin: 0 0 8px;
            color: var(--muted-text-color);
            font-size: 14px;
          }

          .store-details {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 13px;
            color: var(--muted-text-color);
          }

          .store-detail-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .store-detail-label {
            font-weight: 600;
            color: var(--primary-color);
          }

          .header-actions {
            display: flex;
            align-items: center;
          }

          .pdf-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid var(--element-blue-dark);
            background: linear-gradient(to right, var(--element-blue-dark), var(--element-blue-neon));
            color: #ffffff;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            white-space: nowrap;
          }

          .pdf-button:hover {
            filter: brightness(1.05);
          }

          .pdf-hint {
            margin: 6px 0 0;
            font-size: 11px;
            color: rgba(148, 163, 184, 0.85);
          }

          .category-section {
            margin-top: 24px;
          }

          .category-title {
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--primary-color);
            margin: 0 0 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--border-color);
          }

          .category-products {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .product-card {
            display: flex;
            align-items: stretch;
            gap: 12px;
            padding: 10px 12px;
            background-color: var(--card-background);
            border-radius: 10px;
            border: 1px solid var(--border-color);
          }

          .product-info {
            flex: 1;
            min-width: 0;
          }

          .product-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 4px;
          }

          .product-name {
            font-size: 15px;
            font-weight: 600;
            margin: 0;
          }

          .product-price {
            font-size: 15px;
            font-weight: 700;
            color: var(--accent-color);
            white-space: nowrap;
          }

          .product-description {
            margin: 0;
            font-size: 13px;
            color: var(--muted-text-color);
          }

          .product-image-wrapper {
            width: 88px;
            flex-shrink: 0;
            border-radius: 10px;
            overflow: hidden;
          }

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .empty-state {
            margin-top: 32px;
            text-align: center;
            color: var(--muted-text-color);
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="header-main">
              <div class="logo-wrapper">
              ${
                store.logoUrl
                  ? `<img src="${store.logoUrl}" alt="${store.name}" />`
                  : `<span class="logo-placeholder">${(store.name || 'Loja')
                      .substring(0, 2)
                      .toUpperCase()}</span>`
              }
              </div>
              <div class="store-info">
                <h1 class="store-name">${store.name}</h1>
                <p class="store-subtitle">Cardápio</p>
                <div class="store-details">
                  ${
                    store.address
                      ? `<div class="store-detail-item"><span class="store-detail-label">Endereço:</span><span>${store.address}</span></div>`
                      : ''
                  }
                  ${
                    store.phone
                      ? `<div class="store-detail-item"><span class="store-detail-label">Telefone:</span><span>${store.phone}</span></div>`
                      : ''
                  }
                  ${
                    store.businessHours
                      ? `<div class="store-detail-item"><span class="store-detail-label">Horário:</span><span>${store.businessHours}</span></div>`
                      : ''
                  }
                </div>
                <p class="pdf-hint">Use o botão &quot;Gerar PDF do Cardápio&quot; para baixar este layout em PDF.</p>
              </div>
            </div>
            <div class="header-actions">
              <a href="/cardapio-publico/pdf" target="_blank" rel="noopener" class="pdf-button">
                Gerar PDF do Cardápio
              </a>
            </div>
          </header>

          <main>
            ${categoriesHtml}
          </main>
        </div>
      </body>
    </html>
  `;
}

