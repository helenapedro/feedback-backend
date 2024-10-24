declare module 'multer-s3' {
     import { S3 } from 'aws-sdk';
     import { StorageEngine } from 'multer';
   
     function s3Storage(options: {
       s3: S3;
       bucket: string;
       key?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => void;
       metadata?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => void;
       acl?: string;
       contentType?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, mime?: string) => void) => void;
       contentDisposition?: string;
       serverSideEncryption?: string;
       cacheControl?: string;
       shouldTransform?: boolean;
     }): StorageEngine;
   
     export = s3Storage;
}
   