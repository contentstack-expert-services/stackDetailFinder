const getLocales = async (client, api_key, workbook) => {
  try {
    console.log('Creating Locales worksheet...');
    const localeSheet = workbook.addWorksheet('Locales');

    // Define columns with CONSISTENT KEYS
    localeSheet.columns = [
      { header: 'Master Locale', key: 'master_locale', width: 40 },
      { header: 'Locale Code', key: 'code', width: 30 },
      { header: 'Locale Title', key: 'title', width: 40 },
      { header: 'Locale fallback_locale', key: 'fallback_locale', width: 40 },
    ];

    // Style the header row
    localeSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Locales...');
    const response = client.stack({ api_key: api_key }).locale();

    const fetchedLocales = await response.query().find();

    console.log(`Found ${fetchedLocales.items.length} locales`);

    // Add each content type directly to the Excel sheet
    for (const item of fetchedLocales.items) {
      //   console.log(await item.fetch());

      let master_locale;
      if (!item.fallback_locale) {
        master_locale = true;
      } else {
        master_locale = false;
      }

      // Add row with the formatted URL string
      localeSheet.addRow([
        master_locale, // First column
        item.code, // Second column
        item.name, // Third column
        item.fallback_locale, // Fourth column
      ]);
    }

    console.log('All Locales added to Excel');
    return fetchedLocales.items;
  } catch (error) {
    console.error('Error in getLocales:', error);
    return [];
  }
};

module.exports = getLocales;
