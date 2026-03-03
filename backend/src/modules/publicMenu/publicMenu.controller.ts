import { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import logger from '../../config/logger';
import { publicMenuService } from './publicMenu.service';
import { renderPublicMenuHtml } from './publicMenu.view';
import puppeteer from 'puppeteer';

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
      const html = renderPublicMenuHtml(viewModel);

      const browser = await puppeteer.launch({
        // Em ambientes de servidor (Render), o modo headless padrão já é suficiente.
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, {
          waitUntil: 'networkidle0',
        });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '12mm',
            right: '12mm',
            bottom: '12mm',
            left: '12mm',
          },
        });

        // Envio explícito do PDF para evitar qualquer interferência
        res.status(200);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="cardapio-publico.pdf"');
        res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer as any).toString());
        res.end(pdfBuffer);
        return;
      } finally {
        await browser.close();
      }
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

