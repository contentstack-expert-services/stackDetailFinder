const getContentType = async (client, api_key, workbook) => {
  try {
    console.log('Creating Content Types worksheet...');
    const contentTypeSheet = workbook.addWorksheet('Content Types');

    // First, fetch all locales to create dynamic columns
    console.log('Fetching locales for dynamic columns...');
    const localeResponse = client.stack({ api_key: api_key }).locale();
    const fetchedLocales = await localeResponse.query().find();

    console.log(`Found ${fetchedLocales.items.length} locales for columns`);

    // Define basic columns
    const baseColumns = [
      { header: 'Content Type UID', key: 'uid', width: 30 },
      { header: 'Content Type Name', key: 'title', width: 40 },
      { header: 'Used as a reference in', key: 'reference', width: 50 },
      { header: 'Field Visibility Rules', key: 'field_rules_count', width: 40 },
      { header: 'Field Count', key: 'field_count', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
    ];

    // Add dynamic columns for each locale
    const allColumns = [...baseColumns];

    // Create a locale map for later use
    const localeMap = {};

    fetchedLocales.items.forEach((locale, index) => {
      const localeKey = `locale_${locale.code.replace(/-/g, '_')}`;
      localeMap[locale.code] = localeKey;

      // Add column for this locale
      allColumns.push({
        header: `${locale.code}`,
        key: localeKey,
        width: 25,
      });
    });

    // Apply all columns to the sheet
    contentTypeSheet.columns = allColumns;

    // Style the header row
    contentTypeSheet.getRow(1).font = { bold: true };

    // Setup for pagination
    const limit = 100;
    let skip = 0;
    let totalProcessed = 0;
    let totalCount = 0;
    let hasMoreItems = true;

    // Create content type response object
    const response = client.stack({ api_key: api_key }).contentType();

    console.log('Fetching content types with pagination...');

    // Process all pages of content types
    while (hasMoreItems) {
      console.log(`Fetching content types batch: skip=${skip}, limit=${limit}`);

      // Fetch current page of content types
      const fetchedContentType = await response
        .query({
          include_count: true,
          skip: skip,
          limit: limit,
        })
        .find();

      // Get total count from first response
      if (totalCount === 0 && fetchedContentType.count) {
        totalCount = fetchedContentType.count;
        console.log(`Total content types to process: ${totalCount}`);
      }

      // Process content types from this batch
      const batchSize = fetchedContentType.items.length;
      console.log(`Processing batch of ${batchSize} content types`);

      // Add each content type to Excel
      for (const item of fetchedContentType.items) {
        console.log(`Processing content type: ${item.uid}`);

        let field_rules_count = 0;
        if (item?.field_rules) {
          field_rules_count = item?.field_rules.length;
        }

        let type;
        if (item?.options?.singleton === false) {
          type = 'multi';
        } else {
          type = 'single';
        }

        // Get references
        let references = await item.references();
        let referencesString = '';

        if (references && references.references) {
          if (references.references.length > 0) {
            referencesString = references.references.join(', ');
          }
        }

        // Prepare a row object with base data
        const rowData = {
          uid: item.uid,
          title: item.title,
          reference: referencesString,
          field_rules_count: field_rules_count,
          field_count: item.schema.length,
          type: type,
        };

        for (const localeItem of fetchedLocales.items) {
          console.log(
            `Fetching entries for ${item.uid} in locale ${localeItem.code}`
          );

          try {
            const countResult = await item
              .entry()
              .query({ include_count: true, locale: localeItem.code })
              .find();

            const localeEntryCount = countResult.count || 0;

            // Add this locale's entry count to the row data
            const localeKey = localeMap[localeItem.code];
            rowData[localeKey] = localeEntryCount;

            console.log(
              `Found ${localeEntryCount} entries for ${item.uid} in ${localeItem.code}`
            );
          } catch (e) {
            console.log(
              `Couldn't get entry count for ${item.uid} in ${localeItem.code}: ${e.message}`
            );
            // Add 0 if there was an error
            const localeKey = localeMap[localeItem.code];
            rowData[localeKey] = 0;
          }
        }

        // Add row to Excel with all the data
        contentTypeSheet.addRow(rowData);
        console.log(
          `Added row for ${item.uid} with locale-specific entry counts`
        );
      }

      // Update processed count and skip for next batch
      totalProcessed += batchSize;
      console.log(`Processed ${totalProcessed} of ${totalCount} content types`);

      // Prepare for next batch if needed
      skip += limit;

      // Check if we've processed all items
      if (totalProcessed >= totalCount || batchSize < limit) {
        hasMoreItems = false;
        console.log('All content types processed');
      }
    }

    console.log('All content types added to Excel');
    return totalProcessed;
  } catch (error) {
    console.error('Error in getContentType:', error);
    return [];
  }
};

module.exports = getContentType;
