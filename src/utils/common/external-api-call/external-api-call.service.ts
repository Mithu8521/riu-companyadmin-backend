import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import { firstValueFrom, map, switchMap } from 'rxjs';

@Injectable()
export class ExternalApiCallService {
  constructor(private readonly httpService: HttpService) {}

  async getReq(url: string, queryParams: any, headers: any): Promise<any> {
    headers['Accept-Encoding'] = 'gzip,deflate,compress';
    headers['Accept'] = 'application/json';

    try {
      return firstValueFrom(
        this.httpService
          .get(url, { headers, params: queryParams })
          .pipe(switchMap(async (x: any) => x.data)),
      );
    } catch (ex) {}
  }

  async postReq(headers: any, requestBody, url): Promise<any> {
    headers['Accept'] = 'application/json';
    try {
      return firstValueFrom(
        this.httpService
          .post(url, requestBody, { headers })
          .pipe(switchMap(async (x: any) => x.data)),
      );
    } catch (ex) {}
  }

  async postFormDataReq(file: Express.Multer.File, url: string): Promise<any> {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const headers = {
      ...form.getHeaders(),
      'Accept': 'application/json',
    };

    try {
      const response$ = this.httpService.post(url, form, {
        headers,
        maxBodyLength: Infinity,
      });

      const response = await firstValueFrom(response$);
      return response.data;
    } catch (error) {
      console.error('HTTPService FormData POST failed:', error.message || error);
      throw error;
    }
  }
}
