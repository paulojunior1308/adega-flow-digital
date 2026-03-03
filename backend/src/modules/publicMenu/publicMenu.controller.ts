import { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
// @ts-ignore - axios possui tipos próprios, mas o TS pode não resolvê-los corretamente em alguns ambientes
import axios from 'axios';
// @ts-ignore - importação default do PDFKit para Node
import PDFDocument from 'pdfkit';
import logger from '../../config/logger';
import { publicMenuService, PublicMenuViewModel } from './publicMenu.service';
import { renderPublicMenuHtml } from './publicMenu.view';

export const publicMenuController = {
  async getPublicMenuPage(req: Request, res: Response) {
    try {
      const viewModel = await publicMenuService.getPublicMenuViewModel();
      const html = renderPublicMenuHtml(viewModel);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (error) {
      logger.error('Erro ao renderizar cardápio público:', error);
      return res
        .status(500)
        .send('<h1>Erro ao carregar o cardápio público</h1><p>Tente novamente mais tarde.</p>');
    }
  },

  async getPublicMenuPdf(req: Request, res: Response) {
    try {
      const viewModel = await publicMenuService.getPublicMenuViewModel();

      res.status(200);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="cardapio-publico.pdf"');

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.pipe(res);

      await renderPublicMenuPdf(doc, viewModel);

      doc.end();
      return;
    } catch (error) {
      logger.error('Erro ao gerar PDF do cardápio público:', error);
      return res
        .status(500)
        .json({ error: 'Erro ao gerar PDF do cardápio público. Tente novamente mais tarde.' });
    }
  },

  async getPublicMenuImageProxy(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).send('Parâmetro "url" é obrigatório.');
      }

      const decodedUrl = decodeURIComponent(url);

      // Evita transformar o endpoint em um proxy aberto: só permite Cloudinary
      if (!/^https:\/\/res\.cloudinary\.com\//.test(decodedUrl)) {
        return res.status(400).send('URL de imagem inválida.');
      }

      const target = new URL(decodedUrl);
      const client = target.protocol === 'https:' ? https : http;

      client
        .get(target, (upstreamRes) => {
          const contentType = upstreamRes.headers['content-type'] || 'image/jpeg';
          res.setHeader('Content-Type', contentType);

          // Evita cache agressivo em navegadores intermediários
          res.setHeader('Cache-Control', 'public, max-age=3600');

          upstreamRes.pipe(res);
        })
        .on('error', (err) => {
          logger.error('Erro ao proxiar imagem do cardápio público:', err);
          if (!res.headersSent) {
            res.status(500).end();
          }
        });
    } catch (error) {
      logger.error('Erro ao processar proxy de imagem do cardápio público:', error);
      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  },
};

async function loadImageSourceForPdf(src: string): Promise<Buffer | string | null> {
  try {
    if (!src) return null;

    // Caminhos locais servidos pelo backend
    if (src.startsWith('/uploads')) {
      const filePath = path.resolve(process.cwd(), `.${src}`);
      if (fs.existsSync(filePath)) return filePath;
      return null;
    }

    if (src.startsWith('/public')) {
      const filePath = path.resolve(process.cwd(), `../frontend${src}`);
      if (fs.existsSync(filePath)) return filePath;
      return null;
    }

    // URLs externas (Cloudinary, etc)
    if (src.startsWith('http')) {
      let finalUrl = src;

      // Para Cloudinary, força formato JPEG (compatível com PDFKit)
      if (/^https:\/\/res\.cloudinary\.com\//i.test(src)) {
        finalUrl = src.replace(/\.(webp|avif|png)$/i, '.jpg');
      }

      const lower = finalUrl.toLowerCase();
      const isSupported =
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png');

      if (!isSupported) {
        return null;
      }

      const response = await axios.get<ArrayBuffer>(finalUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }

    return null;
  } catch (error) {
    logger.warn('Erro ao carregar imagem para PDF do cardápio público:', error);
    return null;
  }
}

async function renderPublicMenuPdf(doc: PDFDocument, viewModel: PublicMenuViewModel): Promise<void> {
  const { store, categories } = viewModel;

  // Cabeçalho
  let cursorY = doc.y;
  const logoSize = 60;
  const headerHeight = 70;

  if (store.logoUrl) {
    const logoSource = await loadImageSourceForPdf(store.logoUrl);
    if (logoSource) {
      try {
        doc
          .save()
          .circle(40 + logoSize / 2, cursorY + logoSize / 2, logoSize / 2)
          .clip()
          .image(logoSource as any, 40, cursorY, {
            width: logoSize,
            height: logoSize,
          })
          .restore();
      } catch (error) {
        logger.warn('Não foi possível desenhar o logo no PDF do cardápio público:', error);
      }
    }
  }

  const textX = store.logoUrl ? 40 + logoSize + 16 : 40;

  doc
    .fontSize(18)
    .fillColor('#1A374D')
    .text((store.name || 'Cardápio').toUpperCase(), textX, cursorY, {
      continued: false,
    });

  cursorY = doc.y + 4;
  doc
    .fontSize(12)
    .fillColor('#6B7280')
    .text('Cardápio', textX, cursorY);

  cursorY = doc.y + 8;

  const details: string[] = [];
  if (store.address) details.push(store.address);
  if (store.phone) details.push(store.phone);
  if (store.businessHours) details.push(store.businessHours);

  if (details.length) {
    doc
      .fontSize(10)
      .fillColor('#6B7280')
      .text(details.join(' • '), textX, cursorY);
  }

  doc.moveTo(40, cursorY + 22).lineTo(doc.page.width - 40, cursorY + 22).strokeColor('#E5E7EB').stroke();
  doc.moveDown(2);

  // Conteúdo: categorias e produtos
  for (const category of categories) {
    if (!category.products.length) continue;

    ensurePdfSpace(doc, headerHeight);

    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const priceColWidth = 70;
    const priceColX = pageWidth - marginRight - priceColWidth;

    doc
      .fontSize(14)
      .fillColor('#1A374D')
      .text(category.name.toUpperCase(), {
        underline: false,
      });

    // Cabeçalho da "tabela": Produto / Preço
    doc.moveDown(0.2);
    const headerY = doc.y;

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('PRODUTO / DESCRIÇÃO', marginLeft, headerY);

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('PREÇO', priceColX, headerY, {
        width: priceColWidth,
        align: 'right',
      });

    doc
      .moveTo(marginLeft, headerY + 10)
      .lineTo(pageWidth - marginRight, headerY + 10)
      .strokeColor('#E5E7EB')
      .stroke();

    doc.moveDown(0.6);

    for (const product of category.products) {
      // Garante espaço razoável para o bloco do produto
      ensurePdfSpace(doc, 60);

      const priceText = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }).format(product.price);

      const rowY = doc.y;
      const nameColWidth = priceColX - marginLeft - 8;

      // Nome na coluna da esquerda
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text(product.name, marginLeft, rowY, {
          width: nameColWidth,
        });

      // Preço alinhado na coluna da direita
      doc
        .fontSize(11)
        .fillColor('#e11d48')
        .text(priceText, priceColX, rowY, {
          width: priceColWidth,
          align: 'right',
        });

      let currentY = doc.y;

      // Descrição embaixo, se existir
      if (product.description) {
        doc
          .fontSize(9)
          .fillColor('#6B7280')
          .text(product.description, marginLeft, currentY + 2, {
            width: pageWidth - marginLeft - marginRight,
            lineGap: 2,
          });
        currentY = doc.y;
      }

      // Linha separadora entre produtos
      doc
        .moveTo(marginLeft, currentY + 3)
        .lineTo(pageWidth - marginRight, currentY + 3)
        .strokeColor('#E5E7EB')
        .stroke();

      doc.y = currentY + 7;
    }

    doc.moveDown(0.5);
  }
}

function ensurePdfSpace(doc: PDFDocument, neededHeight: number) {
  const bottomMargin = doc.page.margins.bottom || 40;
  const available = doc.page.height - bottomMargin - doc.y;
  if (available < neededHeight) {
    doc.addPage();
  }
}

