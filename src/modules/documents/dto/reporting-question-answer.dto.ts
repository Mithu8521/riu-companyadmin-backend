import { Expose, Type } from "class-transformer";


export class ReportingQuestionAnswerDTO {
    @Expose() documentId: number;

    @Expose() financialYearId: number;

    @Expose() questionId: number;

    @Expose() sourceId: number;

    @Expose() subLocationId: number;  

    @Expose() moduleName: string;
    
    @Expose() frequency: string;

    @Expose() fromDate: string;

    @Expose() toDate: string;
    
    @Expose() row?: number;

    @Expose() readingColumn?: number;

    @Expose() readingValue?: string | number;
  
    @Expose() readingUnit?: string;

    @Expose() addToReporting: boolean = false;

    @Expose() addReadings: boolean = false;

    /**
     * Supported Operations Type
     * 1. SUM (Add two numbers)
     * 2. REPLACE (Replace existing value with the new value)
     */
    @Expose() operationType?: string;
}