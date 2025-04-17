const getLabels = async (client, api_key, workbook) => {
  try {
    console.log('Creating Labels worksheet...');
    const labelSheet = workbook.addWorksheet('Labels');

    // Define columns with CONSISTENT KEYS - added Level column
    labelSheet.columns = [
      { header: 'Label Name', key: 'name', width: 40 },
      { header: 'Label UID', key: 'uid', width: 30 },
      { header: 'Parent uid', key: 'parent', width: 30 },
      { header: 'Content Types', key: 'content_types', width: 40 },
    ];

    // Style the header row
    labelSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create label response object
    const response = client.stack({ api_key: api_key }).label();

    // Store all labels
    let allLabels = [];

    console.log('Fetching labels with pagination...');

    // Process all pages of labels
    while (hasMoreItems) {
      console.log(`Fetching labels batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of labels
      const fetchedLabels = await response
        .query({
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      console.log(
        `Found ${fetchedLabels.items.length} labels in current batch`
      );

      // Update total count and check if there are more items
      if (totalCount === 0 && fetchedLabels.count) {
        totalCount = fetchedLabels.count;
        console.log(`Total labels to process: ${totalCount}`);
      }

      // Process labels from this batch
      const batchSize = fetchedLabels.items.length;

      // Collect all labels from this batch
      for (const item of fetchedLabels.items) {
        const label = await item;
        allLabels.push(label);
      }

      // Update processed count and skip for next batch
      totalProcessed += batchSize;
      console.log(`Collected ${totalProcessed} of ${totalCount} labels`);

      // Prepare for next batch if needed
      skip += limit;

      // Check if we've processed all items
      if (totalProcessed >= totalCount || batchSize < limit) {
        hasMoreItems = false;
        console.log('All labels collected');
      }
    }

    // Build a map for quick label lookups
    const labelMap = {};
    allLabels.forEach((label) => {
      labelMap[label.uid] = label;
    });

    // Organize labels by parent-child relationships
    console.log('Building hierarchical structure...');

    // Function to write labels in hierarchical order
    let rowCount = 0;

    const writeLabelHierarchy = (label, level = 0) => {
      // Convert the content types to a string
      let contentTypeString = '';
      if (label.content_types && label.content_types.length > 0) {
        contentTypeString = label.content_types.join(', ');
      }

      // Create row for current label with indentation
      labelSheet.addRow({
        name: label.name || '',
        uid: label.uid,
        parent: label.parent && label.parent.length > 0 ? label.parent[0] : '',
        content_types: contentTypeString,
      });

      rowCount++;

      // Find children of this label
      const children = allLabels.filter(
        (l) => l.parent && l.parent.length > 0 && l.parent[0] === label.uid
      );

      // Sort children alphabetically by name
      children.sort((a, b) => {
        const aName = a.name || '';
        const bName = b.name || '';
        return aName.localeCompare(bName);
      });

      // Process each child recursively
      children.forEach((child) => {
        writeLabelHierarchy(child, level + 1);
      });
    };

    // Find all root-level labels (no parent)
    const rootLabels = allLabels.filter(
      (label) => !label.parent || label.parent.length === 0
    );

    // Sort the root labels alphabetically
    rootLabels.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });

    // Write the full hierarchy to Excel
    rootLabels.forEach((label) => {
      writeLabelHierarchy(label);
    });

    console.log(`Added ${rowCount} labels to Excel in hierarchical order`);
    return rowCount;
  } catch (error) {
    console.error('Error in getLabels:', error);
    return [];
  }
};

module.exports = getLabels;
