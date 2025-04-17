const path = require('path');
const fs = require('fs');
const contentstack = require('@contentstack/management');
const Excel = require('exceljs');

const getBranches = require('./branches');
const getContentTypeData = require('./contentType');
const getLocales = require('./locale');
const getAssets = require('./assets');
const getGlobalFields = require('./globalFields');
const getEnvironments = require('./environments');
const getExtensions = require('./extensions');
const getWorkflows = require('./workflows');
const getWebhooks = require('./webhooks');
const getLabels = require('./labels');
const getUsers = require('./users');
const getRoles = require('./roles');

// This is the correct pattern
async function fetchStack(
  authtoken,
  org_uid,
  api_key,
  hasBranches,
  branch_uid
) {
  // Create Excel workbook
  const workbook = new Excel.Workbook();
  const stacksSheet = workbook.addWorksheet('Stack Stats');

  // Define columns for Excel
  stacksSheet.columns = [
    { header: 'Stack UID', key: 'stack_uid', width: 30 },
    { header: 'Stack Name', key: 'stack_name', width: 30 },
    { header: 'Master Locale', key: 'master_locale', width: 15 },
    { header: 'Branches', key: 'branches', width: 15 },
    { header: 'Content Types', key: 'content_types', width: 15 },
    { header: 'Assets', key: 'assets', width: 15 },
    { header: 'Assets Folders', key: 'assets_folders', width: 15 },
    { header: 'Locales', key: 'locales', width: 15 },
    { header: 'Global Fields', key: 'global_fields', width: 15 },
    { header: 'Environments', key: 'environments', width: 15 },
    { header: 'Delivery Tokens', key: 'deliveryToken', width: 15 },
    { header: 'Management Tokens', key: 'managementTokens', width: 15 },
    { header: 'Extensions', key: 'extensions', width: 15 },
    { header: 'Workflows', key: 'workflow', width: 15 },
    { header: 'Webhooks', key: 'webhook', width: 15 },
    { header: 'Labels', key: 'labels', width: 15 },
    { header: 'Variants', key: 'variants', width: 15 },
    { header: 'Users', key: 'users', width: 15 },
    { header: 'Roles', key: 'roles', width: 15 },
    { header: 'Taxonomies', key: 'taxonomies', width: 15 },
    { header: 'Taxonomies Terms', key: 'terms', width: 15 },
  ];

  // Style the header row
  stacksSheet.getRow(1).font = { bold: true };

  try {
    let client;

    if (hasBranches) {
      console.log(`\nFetching stack details for the '${branch_uid}' branch...`);

      client = contentstack.client({
        authtoken,
        headers: {
          branch: `${branch_uid}`,
        },
      });
    } else {
      client = contentstack.client({
        authtoken,
      });
    }

    let orgPlanReaderPath = path.join(
      process.cwd(),
      org_uid,
      `${org_uid}-plan.json`
    );

    const data = fs.readFileSync(orgPlanReaderPath, 'utf-8');
    const planData = JSON.parse(data);
    const hasVariant = planData.some((item) => item.uid === 'variants');
    const hasTaxonomies = planData.some((item) => item.uid === 'taxonomy');

    // Create a directory for the organization if it doesn't exist
    const orgPath = path.join(process.cwd(), org_uid);
    if (!fs.existsSync(orgPath)) {
      fs.mkdirSync(orgPath, { recursive: true });
    }

    try {
      // Directly fetch the specific stack instead of all stacks
      const stack = await client.stack({ api_key: api_key }).fetch();

      // Gather all stack data
      const contentTypeCount = await stack.contentType().query().count();

      let branchCount;
      if (hasBranches) {
        branchCount = await stack
          .branch()
          .query({ include_count: true })
          .find();
      }
      const assets = await stack.asset().query().count();
      const assets_folders = await stack
        .asset()
        .query({ include_folders: true })
        .count();
      const localeCount = await stack.locale().query().count();
      const globalFieldCount = await stack.globalField().query().count();
      const environmentCount = await stack.environment().query().count();
      const deliveryTokenCount = await stack
        .deliveryToken()
        .query({ include_count: true })
        .find();
      const managementTokenCount = await stack
        .managementToken()
        .query({ include_count: true })
        .find();
      const extensionCount = await stack.extension().query().count();
      const workflowData = await stack.workflow().fetchAll();
      const webhookData = await stack.webhook().fetchAll();
      const labelCount = await stack.label().query().count();

      let variantsCount;
      if (hasVariant) {
        variantsCount = await stack.variants().query().count();
      }
      const usersData = await stack.users();
      const roleCount = await stack.role().fetchAll();

      let taxonomyCount, taxonomyTermsCount;
      if (hasTaxonomies) {
        taxonomyCount = await stack
          .taxonomy()
          .query({ include_count: true })
          .find();

        taxonomyTermsCount = await stack.taxonomy().query().find();
      }

      const assetsFolderCount = assets_folders.assets - assets.assets;

      // Organize the stack data
      let stackData = {
        stack_uid: stack.api_key,
        stack_name: stack.name,
        branches: hasBranches ? branchCount.items?.length ?? 0 : 0,
        master_locale: stack.master_locale,
        ...contentTypeCount,
        ...assets,
        assets_folders: assetsFolderCount,
        ...localeCount,
        ...globalFieldCount,
        ...environmentCount,
        deliveryToken: deliveryTokenCount.count,
        managementTokens: managementTokenCount.count,
        ...extensionCount,
        workflow: workflowData.items.length,
        webhook: webhookData.items.length,
        ...labelCount,
        ...(hasVariant ? variantsCount : { variants: 0 }),
        users: usersData.length,
        roles: roleCount.items.length,
        taxonomies: hasTaxonomies ? taxonomyCount.count ?? 0 : 0,
      };

      // Add row to Excel
      stacksSheet.addRow({
        stack_uid: stackData.stack_uid,
        stack_name: stackData.stack_name,
        master_locale: stackData.master_locale,
        branches: stackData.branches || 0, // Use the value already in stackData
        content_types: stackData.content_types || 0,
        assets: stackData.assets || 0,
        assets_folders: assetsFolderCount || 0,
        locales: stackData.locales || 0,
        global_fields: stackData.global_fields || 0,
        environments: stackData.environments || 0,
        deliveryToken: stackData.deliveryToken || 0,
        managementTokens: stackData.managementTokens || 0,
        extensions: stackData.extensions || 0,
        workflow: stackData.workflow || 0,
        webhook: stackData.webhook || 0,
        labels: stackData.labels || 0,
        variants: stackData?.variants || 0,
        users: stackData.users || 0,
        roles: roleCount.items.length || 0,
        taxonomies: stackData?.taxonomy || 0,
        // taxonomies_terms: stackData?.terms || 0,
      });

      if (hasBranches) {
        // Call getBranches with the workbook
        console.log('Getting branches data...');
        await getBranches(client, api_key, workbook);
      }

      // Call getContentType with the workbook
      console.log('Getting content type data...');
      await getContentTypeData(client, api_key, workbook);

      // Call getLocales with the workbook
      console.log('Getting locales data...');
      await getLocales(client, api_key, workbook);

      // Call getAssets with the workbook
      console.log('Getting assets data...');
      await getAssets(client, api_key, workbook);

      // Call getGlobalFields with the workbook
      console.log('Getting global fields data...');
      await getGlobalFields(client, api_key, workbook);

      // Call getEnvironments with the workbook
      console.log('Getting environments data...');
      await getEnvironments(client, api_key, workbook);

      // Call getExtensions with the workbook
      console.log('Getting extensions data...');
      await getExtensions(client, api_key, workbook);

      // Call getWorkflows with the workbook
      console.log('Getting workflows data...');
      await getWorkflows(client, api_key, workbook);

      // Call getWebhooks with the workbook
      console.log('Getting webhooks data...');
      await getWebhooks(client, api_key, workbook);

      // Call getLabels with the workbook
      console.log('Getting labels data...');
      await getLabels(client, api_key, workbook);

      // Call getUsers with the workbook
      console.log('Getting users data...');
      await getUsers(client, api_key, workbook);

      // Call getRoles with the workbook
      console.log('Getting roles data...');
      await getRoles(client, api_key, workbook);

      console.log('Saving Excel workbook...');
      // Then save the workbook with both sheets
      const excelFilePath = path.join(
        process.cwd(),
        org_uid,
        `${api_key}-${branch_uid || ''}-stack-report.xlsx`
      );
      await workbook.xlsx.writeFile(excelFilePath);
      console.log(`Excel report created successfully at: ${excelFilePath}`);
    } catch (stackError) {
      console.error('Error fetching stack:', stackError);
    }
  } catch (error) {
    console.error('Error in fetchStackDetails:', error);
  }
}

module.exports = fetchStack;
