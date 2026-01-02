import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UseInterceptors, UploadedFile, ValidationPipe, UsePipes } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaveDocumentDto } from './dto/save-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { DocumentDto } from './dto/document.dto';
import { FileInterceptor } from '@nestjs/platform-express';


@UseGuards(VerifyTokenGuard)
@ApiTags('Dashboard Graph Apis')
@Controller('v1.0')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('postLogin/documents')
  @ApiOperation({ summary: 'Create Document' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Create Document' })
  @ApiBody({ type: SaveDocumentDto, description: 'api body' })
  @UseInterceptors(FileInterceptor('file'))
  saveDocument(@Req() request, @Body() body: SaveDocumentDto): Promise<DocumentDto> {
    return this.documentsService.createDocument(request, body);
  }

  @Get('postLogin/documents')
  @ApiOperation({ summary: 'List Documents' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({status: 200, description: 'List Documents', type: ''})
  listDocuments(@Req() request): Promise<ListDocumentsDto> {
    return this.documentsService.listDocuments(request);
  }

  @Get('postLogin/documents/kpis')
  @ApiOperation({ summary: 'Get Document KPIs' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({status: 200, description: 'Get Document KPIs', type: ''})
  getDocumentKPIs(@Req() req) {
    return this.documentsService.getDocumentKPIs(req);
  }

  @Post('postLogin/documents/upload')
  @ApiOperation({ summary: 'Parse and Upload Document' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @UseInterceptors(FileInterceptor('file'))
  parseAndUploadDocument(@Req() req, @UploadedFile() file: Express.Multer.File): Promise<Partial<DocumentDto>> {
    return this.documentsService.parseAndUploadDocument(req, file);
  }

  // IMPORTANT: Keep dynamic urls always in the end.
  @Post('postLogin/documents/:documentId')
  @ApiOperation({ summary: 'Update Document' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Update Document' })
  @ApiBody({ type: SaveDocumentDto, description: 'api body' })
  @UseInterceptors(FileInterceptor('file'))
  updateDocument(@Req() request, @Param('documentId') documentId: string, @Body() body: SaveDocumentDto): Promise<DocumentDto> {
    return this.documentsService.updateDocument(request, documentId, body);
  }

  @Delete('postLogin/documents/:documentId')
  @ApiOperation({ summary: 'Delete Document' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Delete Document' })
  @UseInterceptors(FileInterceptor('file'))
  deleteDocument(@Req() request, @Param('documentId') documentId: string): Promise<DocumentDto> {
    return this.documentsService.deleteDocument(request, documentId);
  }

  @Get('postLogin/documents/:documentId')
  @ApiOperation({ summary: 'Get Document by ID' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  getFileByBillId(@Req() request, @Param('documentId') documentId: number): Promise<DocumentDto> {
    return this.documentsService.getDocument(request, documentId);
  }
}
