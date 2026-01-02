import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class HtmlReaderService {
  readHTMLFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
        if (err) {
          reject(err);
        } else {
          resolve(html);
        }
      });
    });
  }
}
