import { AnswerFrequency } from '@app/utils/enums/Status';
import { Injectable, BadRequestException } from '@nestjs/common';
import { parse, format, addMonths, endOfMonth } from 'date-fns';


@Injectable()
export class CommonUtilityService {
  static getModifiedDate(date: Date) {
    return (
      date.getFullYear() +
      '-' +
      (date.getMonth() + 1) +
      '-' +
      +date.getDate() +
      ' ' +
      date.getHours() +
      ':' +
      date.getMinutes() +
      ':' +
      date.getSeconds()
    );
  }

  async generateRandomPassword(length: any): Promise<any> {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  /**
   * Extracts the billing month from a given bill date or date range
   * @param startDate - Optional: start date of billing period in 'YYYY-MM-DD' format
   * @param endDate - Optional: end date of billing period in 'YYYY-MM-DD' format
   * @returns string containing billing month in format 'YYYY-MM'
   */
  static extractMonthFromDateRange(startDate?: string, endDate?: string): string {
  const effectiveEndDate = endDate || startDate;

  
  if (!startDate || !effectiveEndDate) {
    throw new BadRequestException('At least a startDate is required.');
  }

  const start = new Date(startDate);
  const end = new Date(effectiveEndDate);

  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestException('Invalid date format.');
  }

  
  const midpointTime = (start.getTime() + end.getTime()) / 2;
  const date = new Date(midpointTime);

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${year}-${month.toString().padStart(2, '0')}`;
}

  static formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };


  /**
   * Extracts the financial year for a given month and year, based on a customizable financial year start month.
   *
   * @param month - Month (1-12)
   * @param year - Year (e.g., 2023)
   * @param financialYearStart - Starting month of the financial year (1-12). Example: 4 for April, 1 for January
   * @returns Financial year in format "YYYY-YYYY" (e.g., "2022-2023")
   */
  static getFinancialYear(month: number, year: number, financialYearStart: number = 4): string {
    // Validate inputs
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (financialYearStart < 1 || financialYearStart > 12) {
      throw new Error('financialYearStart must be between 1 and 12');
    }

    let startYear: number;
    let endYear: number;

    if (month >= financialYearStart) {
      startYear = year;
      endYear = year + 1;
    } else {
      startYear = year - 1;
      endYear = year;
    }

    return `${startYear}-${endYear}`;
  }

  static formateDateIntoPeriods = (fromDateStr:string,toDateStr:string) => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!fromDateStr || !toDateStr) return "";

  const [fromYear, fromMonth] = fromDateStr.split("-").map(Number);
  const [toYear, toMonth] = toDateStr.split("-").map(Number);

  const startMonth = MONTHS[fromMonth - 1];
  const endMonth = MONTHS[(toMonth - 1 + 12 - 1) % 12]; // one month before toDate

  if (startMonth === endMonth) {
    return startMonth; // Single month period
  }

  return `${startMonth}-${endMonth}`;
  };
  /**
   * 
   * @param reportingMonth YYYY-MM
   * @param financialYearStart 1-12
   * @param reportingFrequency MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
   * @returns fromDate (inclusive), toDate (exclusive)
   */
  getReportingPeriod(reportingMonth: string, financialYearStart: number, reportingFrequency: AnswerFrequency): { fromDate: string; toDate: string } {
    const [year, month] = reportingMonth.split("-").map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return;
    }

    // Figure out the FY start for the given reporting month
    const fyStart = new Date(
      month >= financialYearStart ? year : year - 1,
      financialYearStart - 1,
      1
    );

    // Determine frequency length
    let periodLength = 1;
    switch (reportingFrequency) {
      case AnswerFrequency.MONTHLY:
        periodLength = 1;
        break;
      case AnswerFrequency.QUARTERLY:
        periodLength = 3;
        break;
      case AnswerFrequency.HALF_YEARLY:
        periodLength = 6;
        break;
      case AnswerFrequency.YEARLY:
        periodLength = 12;
        break;
      default:
        throw Error(`Unsupported Answer Frequency: ${reportingFrequency}`);
    }

    // Compute months since FY start
    const monthsSinceStart =
      (year - fyStart.getFullYear()) * 12 + (month - (fyStart.getMonth() + 1));

    // Find which bucket the reportingMonth falls into
    const bucketIndex = Math.floor(monthsSinceStart / periodLength);

    const fromDate = addMonths(fyStart, bucketIndex * periodLength);
    const toDate = endOfMonth(addMonths(fromDate, periodLength));

    return {
      fromDate: format(fromDate, "yyyy-MM"),
      toDate: format(toDate, "yyyy-MM")
    };
  }

  static safeJsonParse<T = any>(raw: any): T | null {
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }

  parseReportingQuestionId(label: string) {
    // Pattern supports both Q450 and Q450R1C2
    const regex = /^Q(\d+)(?:R(\d+)C(\d+))?$/;
    const match = label.match(regex);

    if (!match) {
      throw new Error(`Invalid variable format: ${label}`);
    }

    return {
      full: label,
      questionId: Number(match[1]),
      row: match[2] ? Number(match[2]) - 1 : null,
      column: match[3] ? Number(match[3]) - 1 : null,
      isTableCell: !!match[2], // true if R & C exist
    };
  }


  safeEvaluate(expression: string): number {
    // pure-math sandbox
    return Function(`"use strict"; return (${expression})`)();
  }

  static normalizeDateString = (v: any): string | null => {
        if (v === undefined || v === null) return null;
        if (typeof v === 'string' && v.trim().toLowerCase() === 'null') return null;
        const s = String(v).trim();
        return s.length ? s : null;
      };

  static toRequiredNumber = (value: any, fieldName: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException(`${fieldName} must be a valid positive number`);
    }
    return n;
  };

  static toOptionalNumber = (value: any): number | null => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

}
