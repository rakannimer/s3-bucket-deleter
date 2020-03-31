// These 3 lines are not necessary if you're using the default aws profile
const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "s3" });
AWS.config.credentials = credentials;

const S3 = require("aws-sdk/clients/s3");
const s3 = new S3();

const { MultiSelect } = require("enquirer");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const deleteBucket = async Bucket => {
  try {
    console.log(`Deleting ${Bucket}`);
    // We can't delete a bucket before emptying its contents
    const { Contents } = await s3.listObjects({ Bucket }).promise();
    if (Contents.length > 0) {
      await s3
        .deleteObjects({
          Bucket,
          Delete: {
            Objects: Contents.map(({ Key }) => ({ Key }))
          }
        })
        .promise();
    }
    await s3.deleteBucket({ Bucket }).promise();
    return true;
  } catch (err) {
    console.log("\n", err, "\n");
    return false;
  }
};

const main = async () => {
  const { Buckets } = await s3.listBuckets().promise();
  const choices = Buckets.map(({ Name }) => ({ name: Name, value: Name }));
  const prompt = new MultiSelect({
    name: "value",
    message: "Select the buckets you would like to delete",
    choices
  });

  const bucketsToDelete = await prompt.run();
  let deletedBuckets = 0;
  for (let bucket of bucketsToDelete) {
    await delay(200);
    const isDeleted = await deleteBucket(bucket);
    deletedBuckets += isDeleted ? 1 : 0;
  }
  console.log(
    `\nDeleted ${deletedBuckets}/${bucketsToDelete.length} buckets.\n`
  );
};

main();
