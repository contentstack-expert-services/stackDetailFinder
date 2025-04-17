const getGlobalFields = async (client, api_key, workbook) => {
  try {
    console.log('Creating Global Fields worksheet...');
    const globalFieldsSheet = workbook.addWorksheet('Global Fields');

    // Define columns with CONSISTENT KEYS
    globalFieldsSheet.columns = [
      { header: 'Global Field UID', key: 'uid', width: 30 },
      { header: 'Global Field Name', key: 'title', width: 40 },
      { header: 'Used as a reference in', key: 'reference', width: 50 },
    ];

    // Style the header row
    globalFieldsSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create global field response object
    const response = client.stack({ api_key: api_key }).globalField();

    console.log('Fetching global fields with pagination...');

    // Process all pages of global fields
    while (hasMoreItems) {
      console.log(`Fetching global fields batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of global fields
      const fetchedGlobalFields = await response
        .query({
          include_content_types: true,
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      // Get total count from first response
      if (totalCount === 0 && fetchedGlobalFields.count) {
        totalCount = fetchedGlobalFields.count;
        console.log(`Total global fields to process: ${totalCount}`);
      }

      // Process global fields from this batch
      const batchSize = fetchedGlobalFields.items.length;
      console.log(`Processing batch of ${batchSize} global fields`);

      // Add each global field to Excel
      for (const item of fetchedGlobalFields.items) {
        // Get references data
        let referenceString = '';
        let referenceArray = [];

        try {
          const references = await item.referred_content_types;

          // Store the raw reference array for debugging
          if (references && references.length > 0) {
            referenceArray = references;

            // Create a simple string representation of the array
            referenceString = JSON.stringify(
              referenceArray.map((r) => r.title || r.uid)
            );

            // Remove quotes and brackets for cleaner display
            referenceString = referenceString.replace(/[\[\]"]/g, '');
            referenceString = referenceString.replace(/,/g, ', ');
          } else {
            referenceString = '';
          }
        } catch (e) {
          console.log(`Couldn't get references for ${item.uid}: ${e.message}`);
          referenceString = `[Error: ${e.message}]`;
        }

        // Add row using array values (position-based)
        try {
          globalFieldsSheet.addRow([
            item.uid, // First column
            item.title, // Second column
            referenceString, // Third column
          ]);
        } catch (rowError) {
          console.error(`Error adding row for ${item.uid}:`, rowError);
        }
      }

      // Update processed count and skip for next batch
      totalProcessed += batchSize;
      console.log(`Processed ${totalProcessed} of ${totalCount} global fields`);

      // Prepare for next batch if needed
      skip += limit;

      // Check if we've processed all items
      if (totalProcessed >= totalCount || batchSize < limit) {
        hasMoreItems = false;
        console.log('All global fields processed');
      }
    }

    console.log('All global fields added to Excel');
    return totalProcessed;
  } catch (error) {
    console.error('Error in getGlobalFields:', error);
    return [];
  }
};

module.exports = getGlobalFields;
