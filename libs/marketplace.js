const path = require('path');
const fs = require('fs');
const contentstack = require('@contentstack/marketplace-sdk');

const getStackName = require('./getStackName');

const fetchMarketPlace = async (authtoken, org_uid) => {
  const client = contentstack.client({
    authtoken: authtoken,
  });
  try {
    // Read and parse existing JSON
    const filePath = path.join(process.cwd(), org_uid, `${org_uid}.json`);
    const existingDataStr = fs.readFileSync(filePath, 'utf8');
    const existingData = JSON.parse(existingDataStr);

    // Fetch marketplace data
    const collection = await client.marketplace(org_uid).findAllApps();
    let fetchStackDetails = collection?.items;

    // Get installations for each app
    const installationsPromises = fetchStackDetails.map((element) =>
      element?.listInstallations()
    );
    const allInstallations = await Promise.all(installationsPromises);

    // Create an array to store all stacks data for each app
    const appStacksData = [];

    // Process each app's installations and collect stack data
    for (let i = 0; i < allInstallations.length; i++) {
      const installation = allInstallations[i];
      const appUID = fetchStackDetails[i].uid;
      const stacksForApp = [];

      // Process each installation for this app
      for (const item of installation.items) {
        if (item?.target?.uid) {
          // Get stack details and store them
          const stackInfo = await getStackName(
            authtoken,
            org_uid,
            item.target.uid
          );
          if (stackInfo) {
            stacksForApp.push(stackInfo);
          }
        }
      }

      // Store the stacks data for this app
      appStacksData.push({
        appUID: appUID,
        stacks: stacksForApp,
      });
    }

    // Add marketplace data to existing data
    const updatedData = {
      ...existingData,
      marketplace_app_count: collection.count,
      marketplace_app: collection.items.map((element, index) => {
        // Find the stacks data for this app
        const appStacks = appStacksData.find(
          (app) => app.appUID === element.uid
        );

        return {
          name: element.name,
          uid: element.uid,
          description: element.description,
          visibility: element.visibility,
          version: element.version,
          target_type: element.target_type,
          installed_stacks: appStacks ? appStacks.stacks : [],
        };
      }),
    };

    // Write updated data back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 4));

    console.log(
      `${org_uid}.json file updated successfully with marketplace data!`
    );
  } catch (error) {
    console.error('Error updating with marketplace data:', error);
  }
};

module.exports = fetchMarketPlace;
