import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// it is used to get the signed url from the s3 bucket
// fileName is the name of the file in the s3 bucket
// expiresIn is the time in seconds for which the url is valid
// default is 600 seconds (10 minutes)
export const getFromS3 = async (fileName, expiresIn = 600) => {
    return await getSignedUrl(
        s3,
        new GetObjectCommand({
            Key: fileName,
            Bucket: process.env.AWS_BUCKET_NAME,
        }),
        { expiresIn }
    )
}