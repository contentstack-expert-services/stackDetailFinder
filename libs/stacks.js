const path = require('path');
const fs = require('fs');
const fetchBranchDetails = require('./branches');
const contentstack = require('@contentstack/management');

// let authtoken = 'blt3a2b972c90750ec3';
// let org_uid = 'blt4f0502b38f4eab5e';

const fetchStackDetails = async (authtoken, org_uid) => {
  let authtoken = 'blt3a2b972c90750ec3';
  let org_uid = 'blt4f0502b38f4eab5e';
  try {
    const client = contentstack.client({ authtoken });
    const orgPlanReaderRaw = fs.readFileSync(
      path.join(process.cwd(), org_uid, `${org_uid}-plan.json`),
      'utf8'
    );

    // Parse the string into an array of objects
    const orgPlanReader = JSON.parse(orgPlanReaderRaw);

    // Now you can safely use .find()
    const branchObject = orgPlanReader.find((item) => item.uid === 'branches');

    let getBranch;
    // if (orgPlanReader) {
    //   getBranch = orgPlanReader[0];
    // }

    // console.log(typeof orgPlanReader);

    // const roleObject = orgPlanReader.find((item) => item.uid === 'branches');
    // console.log(roleObject);
    // console.log(roleObject);
    client
      .organization(org_uid)
      .stacks({ include_count: true })
      .then((stacks) => {
        stacks.items.map(async (item) => {
          let stackPath = path.join(process.cwd(), org_uid, item.api_key);
          if (!fs.existsSync(stackPath)) {
            fs.mkdirSync(stackPath, {
              recursive: true,
            });
            console.log(
              `Folder by stack uid "${item.api_key}" created successfully!`
            );
          } else {
            console.log(
              `Folder by stack uid "${item.api_key}" already present!`
            );
          }

          client
            .stack({ api_key: item.api_key })
            .fetch()
            .then(async (stack) => {
              let stackData = {
                stack_uid: stack.api_key,
                stack_name: stack.name,
                branches: [],
                master_locale: stack.master_locale,
                ...(await stack.contentType().query().count()),
                ...(await stack.locale().query().count()),
                ...(await stack.globalField().query().count()),
                ...(await stack.environment().query().count()),
                deliveryToken: (await stack.deliveryToken().query().count())
                  .tokens.length,
                managementToken: (await stack.managementToken().query().count())
                  .tokens,
                ...(await stack.extension().query().count()),
                workflow: (await stack.workflow().fetchAll()).items.length,
                webhook: (await stack.webhook().fetchAll()).items.length,
                ...(await stack.label().query().count()),
                ...(await stack.variants().query().count()),
                users: (await stack.users()).length,
                ...(await stack.taxonomy().query().count()),
              };

              if (branchObject) {
                const branchCount = await stack.branch().query().count();
                stackData.branch = branchCount.branches;
              }

              fs.writeFileSync(
                path.join(stackPath, `${item.api_key}.json`),
                JSON.stringify(stackData, null, 4)
              );
              console.log(`${item.api_key}.json file created successfully!`);
            });
        });
      });

    // console.log('await stackList', await stackList);

    // stackList
    //   .then(async (stacklist) => {
    //     for (const element of stacklist.items) {
    //       console.log('element.org_uid', element.org_uid);

    //       if (element.org_uid === org_uid) {
    //         // const stackFolder = path.join(
    //         //   process.cwd(),
    //         //   org_uid,
    //         //   element?.api_key
    //         // );
    //         console.log('stackFolder', element.org_uid);
    //         // if (!fs.existsSync(stackFolder)) {
    //         //   client
    //         //     .stack({ api_key: element?.api_key })
    //         //     .fetch()
    //         //     .then((stack) => console.log(stack));
    //         //   // fs.mkdirSync(stackFolder);
    //         //   //   console.log(
    //         //   //     `Folder by stack uid "${element?.api_key}" created successfully!`
    //         //   //   );
    //         // } else {
    //         //   console.log(
    //         //     `Folder by stack uid "${element?.api_key}" already exists.`
    //         //   );
    //         // }
    //         // await fetchBranchDetails(client, element.api_key);
    //       }
    //     }
    //   })
    //   .catch((error) => {
    //     console.error('Error fetching stacks:', error);
    //   });
  } catch (error) {
    console.error('Error fetching organization:', error);
  }
};

module.exports = fetchStackDetails;
