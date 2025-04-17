const getEnvironments = async (client, api_key, workbook) => {
  try {
    console.log('Creating Environments worksheet...');
    const environmentSheet = workbook.addWorksheet('Environments');

    // Define columns with CONSISTENT KEYS
    environmentSheet.columns = [
      { header: 'Environment UID', key: 'uid', width: 30 },
      { header: 'Environment Name', key: 'name', width: 40 },
      { header: 'Environment Url', key: 'url', width: 40 },
    ];

    // Style the header row
    environmentSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create environment response object
    const response = client.stack({ api_key: api_key }).environment();

    console.log('Fetching environments with pagination...');

    // Process all pages of environments
    while (hasMoreItems) {
      console.log(`Fetching environments batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of environments
      const fetchedEnvironments = await response
        .query({
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      // Get total count from first response
      if (totalCount === 0 && fetchedEnvironments.count) {
        totalCount = fetchedEnvironments.count;
        console.log(`Total environments to process: ${totalCount}`);
      }

      // Process environments from this batch
      const batchSize = fetchedEnvironments.items.length;
      console.log(`Processing batch of ${batchSize} environments`);

      // Add each environment to Excel
      for (const item of fetchedEnvironments.items) {
        // Format the URLs array into a readable string
        let urlString = '';
        if (item.urls && Array.isArray(item.urls) && item.urls.length > 0) {
          // Create a string like: "localhost:4000 (en-us), test (fr)"
          urlString = item.urls
            .map((u) => `{url: ${u.url}, locale: (${u.locale})}`)
            .join(', ');
        } else {
          urlString = 'No URLs found';
        }

        // Add row with the formatted URL string
        environmentSheet.addRow([
          item.uid, // First column
          item.name, // Second column
          urlString, // Third column with formatted URLs
        ]);
      }

      // Update processed count and skip for next batch
      totalProcessed += batchSize;
      console.log(`Processed ${totalProcessed} of ${totalCount} environments`);

      // Prepare for next batch if needed
      skip += limit;

      // Check if we've processed all items
      if (totalProcessed >= totalCount || batchSize < limit) {
        hasMoreItems = false;
        console.log('All environments processed');
      }
    }

    console.log('All environments added to Excel');
    return totalProcessed;
  } catch (error) {
    console.error('Error in getEnvironments:', error);
    return [];
  }
};

module.exports = getEnvironments;
