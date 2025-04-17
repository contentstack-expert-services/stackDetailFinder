const getExtensions = async (client, api_key, workbook) => {
  try {
    console.log('Creating Extensions worksheet...');
    const extensionSheet = workbook.addWorksheet('Extensions');

    // Define columns with CONSISTENT KEYS
    extensionSheet.columns = [
      { header: 'Extension UID', key: 'uid', width: 30 },
      { header: 'Extension Title', key: 'title', width: 40 },
      { header: 'Extension Type', key: 'type', width: 40 }, // Fixed key name
      { header: 'Extension Data Type', key: 'data_type', width: 40 }, // Fixed key name
    ];

    // Style the header row
    extensionSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create extension response object
    const response = client.stack({ api_key: api_key }).extension();

    console.log('Fetching extensions with pagination...');

    // Process all pages of extensions
    while (hasMoreItems) {
      console.log(`Fetching extensions batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of extensions
      const fetchedExtensions = await response
        .query({
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      console.log(`Found ${fetchedExtensions.items.length} Extensions`);

      // Add each content type directly to the Excel sheet
      for (const item of fetchedExtensions.items) {
        // Add row with the formatted URL string
        extensionSheet.addRow([
          item.uid, // First column
          item.title, // Second column
          item.type, // Third column
          item.data_type, // Fourth column
        ]);
      }

      // Update pagination variables
      totalProcessed += fetchedExtensions.items.length;
      totalCount = fetchedExtensions.count;
      skip += limit;
      hasMoreItems = totalProcessed < totalCount;
    }

    console.log('All Extensions added to Excel');
  } catch (error) {
    console.error('Error in getExtensions:', error);
    return [];
  }
};

module.exports = getExtensions;
