import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

AWS.config.update({
  region: 'us-east-2'
});

const s3 = new AWS.S3();

export default s3;
