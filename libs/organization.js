const fs = require('fs');
const path = require('path');

const fetchStackDetails = require('./stacks');
const fetchMarketPlace = require('./marketplace');

const fetchOrganizationDetails = async (authtoken, org_uid, client) => {
  try {
    client
      .organization(org_uid)
      .fetch()
      .then(async (organization) => {
        try {
          const stackCount = await organization.stacks();

          const stack = stackCount?.items.map((item) => {
            return {
              stack_uid: item.uid,
              stack_name: item.name,
            };
          });

          const orgDetail = {
            org_name: organization.name,
            org_uid: organization.uid,
            org_plain_id: organization.plan_id,
            org_expires_on: organization.expires_on,
            total_stacks: stackCount.items.length,
            stacks: stack,
          };

          // Convert JSON object to string
          const orgOutput = JSON.stringify(orgDetail, null, 4); // Pretty print with 4 spaces

          const orgFolder = path.join(process.cwd(), org_uid);

          if (!fs.existsSync(orgFolder)) {
            fs.mkdirSync(orgFolder);
            //   console.log(`Folder by org uid "${org_uid}" created successfully!`);
          } else {
            //   console.log(`Folder by org uid "${org_uid}" already exists.`);
          }

          // Write to a file
          fs.writeFileSync(path.join(orgFolder, `${org_uid}.json`), orgOutput);

          console.log(`${org_uid}.json file created successfully!`);
          // fetchMarketPlace(authtoken, org_uid);
          fetchStackDetails(authtoken, org_uid);
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      });
  } catch (error) {
    console.error('Error fetching organization:', error);
  }
};

module.exports = fetchOrganizationDetails;
