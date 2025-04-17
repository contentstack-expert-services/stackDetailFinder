const getAssets = async (client, api_key, workbook) => {
  try {
    console.log('Creating Assets worksheet...');
    const assetsSheet = workbook.addWorksheet('Assets');
    // Define columns with CONSISTENT KEYS
    assetsSheet.columns = [
      { header: 'Asset Uid', key: 'uid', width: 40 },
      { header: 'Asset Name', key: 'name', width: 40 },
      { header: 'Parent Uid', key: 'parent_uid', width: 40 },
      { header: 'Is Dir?', key: 'is_dir', width: 15 },
      { header: 'File Name', key: 'filename', width: 40 },
      { header: 'Size', key: 'size', width: 15 },
      { header: 'URL', key: 'url', width: 40 },
      { header: 'Content Type', key: 'content_type', width: 25 },
    ];

    // Style the header row
    assetsSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create asset response object
    const response = client.stack({ api_key: api_key }).asset();

    // Store all assets
    let allAssets = [];

    console.log('Fetching assets with pagination...');

    // Process all pages of assets
    while (hasMoreItems) {
      console.log(`Fetching assets batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of assets
      const fetchedAssets = await response
        .query({
          include_folders: true,
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      // Get total count from first response
      if (totalCount === 0 && fetchedAssets.count) {
        totalCount = fetchedAssets.count;
        console.log(`Total assets to process: ${totalCount}`);
      }

      // Process assets from this batch
      const batchSize = fetchedAssets.items.length;
      console.log(`Processing batch of ${batchSize} assets`);

      // Collect all assets from this batch
      for (const item of fetchedAssets.items) {
        const asset = await item;
        allAssets.push(asset);
      }

      // Update processed count and skip for next batch
      totalProcessed += batchSize;
      console.log(`Collected ${totalProcessed} of ${totalCount} assets`);

      // Prepare for next batch if needed
      skip += limit;

      // Check if we've processed all items
      if (totalProcessed >= totalCount || batchSize < limit) {
        hasMoreItems = false;
        console.log('All assets collected');
      }
    }

    // Build a map for quick asset lookups
    const assetMap = {};
    allAssets.forEach((asset) => {
      assetMap[asset.uid] = asset;
    });

    // Organize assets by parent-child relationships
    console.log('Building hierarchical structure...');

    // Function to write assets in hierarchical order
    let rowCount = 0;

    const writeAssetHierarchy = (asset, level = 0) => {
      // Create row for current asset with indentation
      assetsSheet.addRow({
        name: asset.name,
        uid: asset.uid,
        parent_uid: asset.parent_uid || '',
        is_dir: asset.is_dir ? 'Yes' : 'No',
        filename: asset.filename || '',
        size: asset.file_size || '',
        url: asset.url || '',
        content_type: asset.content_type || '',
      });

      rowCount++;

      // Find children of this asset
      if (asset.is_dir) {
        const children = allAssets.filter((a) => a.parent_uid === asset.uid);

        // Sort children: directories first, then files, both alphabetically
        children.sort((a, b) => {
          // First sort by directory vs file
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;

          // Then sort alphabetically by name WITH NULL CHECKS
          const aName = a.name || '';
          const bName = b.name || '';
          return aName.localeCompare(bName);
        });

        // Process each child recursively
        children.forEach((child) => {
          writeAssetHierarchy(child, level + 1);
        });
      }
    };

    // Find all root-level assets (no parent_uid)
    const rootAssets = allAssets.filter((asset) => !asset.parent_uid);

    // Sort the root assets: directories first, then files
    rootAssets.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;

      // Add null checks here too
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });

    // Write the full hierarchy to Excel
    rootAssets.forEach((asset) => {
      writeAssetHierarchy(asset);
    });

    console.log(`Added ${rowCount} assets to Excel in hierarchical order`);
    return rowCount;
  } catch (error) {
    console.error('Error in getAssets:', error);
    return [];
  }
};

module.exports = getAssets;
