require('dotenv').config();

const path = require('path');
const fs = require('fs');
const contentstack = require('@contentstack/management');
const orgPlanFinder = require('./libs/orgPlanFinder');

const fetchStack = require('./libs/fetchStack');
let authtoken = process.env.AUTHTOKEN;
let org_uid = process.env.ORG_UID;
let api_key = process.env.STACK_API_KEY;

const fetchStackDetails = async () => {
  try {
    // Step 1: Make sure orgPlanFinder is properly async and returns a promise
    await orgPlanFinder(process.env.REGION, authtoken, org_uid);
    console.log('Organization plan data collection complete!');

    let orgPlanReaderPath = path.join(
      process.cwd(),
      org_uid,
      `${org_uid}-plan.json`
    );

    const data = fs.readFileSync(orgPlanReaderPath, 'utf-8');
    const planData = JSON.parse(data);

    const hasBranches = planData.some((item) => item.uid === 'branches');

    const client = contentstack.client({
      authtoken,
    });

    // Directly fetch the specific stack instead of all stacks
    const stack = await client.stack({ api_key: api_key }).fetch();

    let branchCount;

    if (hasBranches) {
      branchCount = await stack.branch().query({ include_count: true }).find();

      for (const branch of branchCount.items) {
        await fetchStack(authtoken, org_uid, api_key, hasBranches, branch.uid);
      }
    } else {
      await fetchStack(authtoken, org_uid, api_key);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

fetchStackDetails();
