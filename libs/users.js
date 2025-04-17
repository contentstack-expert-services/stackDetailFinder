const getUsers = async (client, api_key, workbook) => {
  try {
    console.log('Creating Users worksheet...');
    const userSheet = workbook.addWorksheet('Users');

    userSheet.columns = [
      { header: 'First Name', key: 'first_name', width: 30 },
      { header: 'Last Name', key: 'last_name', width: 40 },
      { header: 'Email', key: 'email', width: 50 },
      { header: 'Owner', key: 'is_owner', width: 40 },
      { header: 'Active User', key: 'active', width: 40 },
    ];

    // Style the header row
    userSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Users...');
    const response = client.stack({ api_key: api_key }).users();

    // Add each content type directly to the Excel sheet
    for (const item of await response) {
      //   console.log(await item);

      // Add row with the formatted URL string
      userSheet.addRow([
        item.first_name, // First column
        item.last_name, // Second column
        item.email, // Third column with formatted URLs
        item.is_owner, // Fourth column (string format)
        item.active, // Fifth column (string format)
      ]);
    }

    console.log('All Users added to Excel');
    // return fetchedUsers.items;
  } catch (error) {
    console.error('Error in getUsers:', error);
    return [];
  }
};

module.exports = getUsers;
