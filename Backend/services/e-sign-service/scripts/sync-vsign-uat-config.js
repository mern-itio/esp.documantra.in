/**

 * @deprecated Use: node scripts/switch-vsign-env.js uat [tunnelUrl]

 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { switchProfile } = require('./vsign-profile-lib');



const tunnelBase = (process.argv[2] || '').replace(/\/+$/, '');



switchProfile('uat', tunnelBase)

  .then((result) => {

    console.log(JSON.stringify(result, null, 2));

    if (result.readinessIssues?.length) process.exitCode = 2;

  })

  .catch((err) => {

    console.error(err);

    process.exit(1);

  });

