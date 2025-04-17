const getWebhooks = async (client, api_key, workbook) => {
  try {
    console.log('Creating Webhooks worksheet...');
    const webhookSheet = workbook.addWorksheet('Webhooks');

    // Define columns with CONSISTENT KEYS
    webhookSheet.columns = [
      { header: 'Webhook UID', key: 'uid', width: 30 },
      { header: 'Webhook Name', key: 'name', width: 40 },
      { header: 'Urlpath', key: 'urlPath', width: 30 },
      { header: 'Branches', key: 'branches', width: 40 },
    ];

    // Style the header row
    webhookSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Webhooks...');
    const response = client.stack({ api_key: api_key }).webhook();

    const fetchedWebhooks = await response.fetchAll();

    console.log(`Found ${fetchedWebhooks.items.length} Webhooks`);

    // Add each content type directly to the Excel sheet
    for (const item of fetchedWebhooks.items) {
      // console.log(await item);

      // Convert the branches object to a string
      let branchesString = '';

      // Check if branches exists and has the branches array
      if (item.branches && item.branches.length > 0) {
        // Join the array elements with commas
        branchesString = item.branches.join(', ');
      }

      // Add row with the formatted URL string
      webhookSheet.addRow([
        item.uid, // First column
        item.name, // Second column
        item.urlPath, // Third column with formatted URLs
        branchesString, // Fourth column (string format)
      ]);
    }

    console.log('All Webhooks added to Excel');
    return fetchedWebhooks.items;
  } catch (error) {
    console.error('Error in getWebhooks:', error);
    return [];
  }
};

module.exports = getWebhooks;
