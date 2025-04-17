const getWorkflows = async (client, api_key, workbook) => {
  try {
    console.log('Creating Workflows worksheet...');
    const workflowSheet = workbook.addWorksheet('Workflows');

    // Define columns with CONSISTENT KEYS
    workflowSheet.columns = [
      { header: 'Workflow UID', key: 'uid', width: 30 },
      { header: 'Workflow Name', key: 'name', width: 40 },
      { header: 'Workflow Enable', key: 'enable', width: 40 },
      { header: 'Branches', key: 'branches', width: 40 },
      { header: 'Content Types', key: 'content_types', width: 40 },
    ];

    // Style the header row
    workflowSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Workflows...');
    const response = client.stack({ api_key: api_key }).workflow();
    // console.log(await response.fetchAll());

    const fetchedWorkflows = await response.fetchAll();

    console.log(`Found ${fetchedWorkflows.items.length} workflows`);

    // Add each content type directly to the Excel sheet
    for (const item of fetchedWorkflows.items) {
      // console.log(await item);

      // Convert the branches object to a string
      let branchesString = '';

      // Check if branches exists and has the branches array
      if (item.branches && item.branches.length > 0) {
        // Join the array elements with commas
        branchesString = item.branches.join(', ');
      }

      // Convert the branches object to a string
      let contentTypeString = '';

      // Check if branches exists and has the branches array
      if (item.content_types && item.content_types.length > 0) {
        // Join the array elements with commas
        contentTypeString = item.content_types.join(', ');
      }

      // Add row with the formatted URL string
      workflowSheet.addRow([
        item.uid, // First column
        item.name, // Second column
        item.enabled, // Third column with formatted URLs
        branchesString, // Fourth column (string format)
        contentTypeString, // Fifth column (string format)
      ]);
    }

    console.log('All Workflows added to Excel');
    return fetchedWorkflows.items;
  } catch (error) {
    console.error('Error in getWorkflows:', error);
    return [];
  }
};

module.exports = getWorkflows;
