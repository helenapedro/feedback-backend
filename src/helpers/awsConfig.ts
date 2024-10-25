import { S3Client } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: 'us-east-2',
});

export default s3;
