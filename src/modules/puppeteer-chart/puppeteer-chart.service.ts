// puppeteer-chart.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import ChartDataTransformer, { ChartConfig, RawDataPoint } from './chartjs/chartjs.utility';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerChartService implements OnModuleDestroy {
  private browser: puppeteer.Browser | null = null;

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async getChartPng(data: object, config: object) {
    const chartJsConfig = ChartDataTransformer.transform(data as RawDataPoint[], config as ChartConfig);
    return await this.renderChartPng(chartJsConfig);
  }

  async renderChartPng(chartJsConfig: object, width = 800, height = 400): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // build simple HTML that renders Chart.js
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body, html { margin:0; padding:0; }
          #chart { width: ${width}px; height: ${height}px; }
        </style>
      </head>
      <body>
        <canvas id="chart" width="${width}" height="${height}"></canvas>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          const cfg = ${JSON.stringify(chartJsConfig)};
          const ctx = document.getElementById('chart').getContext('2d');
          new Chart(ctx, cfg);
        </script>
      </body>
      </html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // screenshot the canvas area (clip)
    const canvasHandle = await page.$('#chart');
    const buffer = await canvasHandle.screenshot({ type: 'png' }) as Buffer;
  
    // const outputPath = path.join(__dirname, `../../../debug-charts/widget_${new Date()}.png`);
    // fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    // fs.writeFileSync(outputPath, buffer);
    // console.log(`✅ Saved chart image to: ${outputPath}`);

    await page.close();
    return buffer;
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
