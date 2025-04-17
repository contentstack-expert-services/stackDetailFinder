const getBranches = async (client, api_key, workbook) => {
  try {
    console.log('Creating Branch worksheet...');
    const branchSheet = workbook.addWorksheet('Branches');

    // Define columns with CONSISTENT KEYS
    branchSheet.columns = [
      { header: 'Branch Uid', key: 'uid', width: 30 },
      { header: 'Branch Source', key: 'source', width: 40 },
      { header: 'Branch Alias', key: 'alias', width: 50 },
    ];

    // Style the header row
    branchSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Branches...');
    const response = client.stack({ api_key: api_key }).branch();
    const fetchedContentType = await response.query().find();

    // Add each branches directly to the Excel sheet
    for (const item of await fetchedContentType.items) {
      // Add row with the formatted URL string
      branchSheet.addRow([
        item?.uid, // First column
        item?.source, // Second column
        item?.alias[0]?.uid, // Third column
      ]);
    }
    console.log('All Branches added to Excel');
    // return fetchedUsers.items;
  } catch (error) {
    console.error('Error in getBranches:', error);
    return [];
  }
};

module.exports = getBranches;
