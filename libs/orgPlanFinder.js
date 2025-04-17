const axios = require('axios');
const fs = require('fs');
const path = require('path');

let baseUrl;

const orgPlanFinder = async (region, authtoken, org_uid) => {
  switch (region.toLowerCase()) {
    case 'na':
      baseUrl = `https://app.contentstack.com/`;
      break;
    case 'eu':
      baseUrl = `https://eu-api.contentstack.com/`;
      break;
    case 'azure-na':
      baseUrl = `https://azure-na-api.contentstack.com/`;
      break;
    case 'azure-eu':
      baseUrl = `https://azure-eu-api.contentstack.com/`;
      break;
    case 'gcp-na':
      baseUrl = `https://gcp-na-api.contentstack.com/`;
      break;
    case 'gcp-eu':
      baseUrl = `https://gcp-eu-api.contentstack.com/`;
      break;
    default:
      baseUrl = `https://app.contentstack.com/`;
      break;
  }

  const headers = {
    authtoken: authtoken,
  };

  const url = `${baseUrl}api/v3/organizations/${org_uid}?include_plan=true`;

  const orgPath = path.join(process.cwd(), org_uid);
  const orgDetails = axios
    .get(url, { headers })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error('❌ Error:', error);
    });

  let fetchData = await orgDetails;

  if (!fs.existsSync(orgPath)) {
    fs.mkdirSync(orgPath);
  } else {
    console.log(`Folder by org uid "${org_uid}" already exists.`);
  }

  fs.writeFileSync(
    path.join(process.cwd(), org_uid, `${org_uid}-plan.json`),
    JSON.stringify(fetchData?.organization?.plan?.features, null, 4)
  );

  console.log('✅ Organization plan data fetched successfully!');
};

module.exports = orgPlanFinder;
