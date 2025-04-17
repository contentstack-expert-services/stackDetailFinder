const getRoles = async (client, api_key, workbook) => {
  try {
    console.log('Creating Roles worksheet...');
    const roleSheet = workbook.addWorksheet('Roles');

    // Define columns with CONSISTENT KEYS
    roleSheet.columns = [
      { header: 'First Name', key: 'first_name', width: 30 },
      { header: 'Last Name', key: 'last_name', width: 40 },
      { header: 'Owner', key: 'is_owner', width: 50 },
      { header: 'Invited User', key: 'userEmails', width: 60 },
    ];

    // Style the header row
    roleSheet.getRow(1).font = { bold: true };

    // Fetch content types directly and add to Excel immediately
    console.log('Fetching Roles...');
    const response = client.stack({ api_key: api_key }).role();
    const roles = await response.fetchAll();

    const usersList = await client.stack({ api_key: api_key }).users();
    // console.log(await users);

    // Convert users array to a map for faster lookup
    const userUidToEmailMap = {};
    for (const user of usersList) {
      userUidToEmailMap[user.uid] = user.email;
    }
    // // Add each content type directly to the Excel sheet
    // for (const item of roles.items) {
    //   console.log(item);

    //   // Add row with the formatted URL string
    //   roleSheet.addRow([
    //     item.name, // First column
    //     item.description, // Second column
    //     item.owner, // Third column with formatted URLs
    //     // item.is_owner, // Fourth column (string format)
    //     // item.active, // Fifth column (string format)
    //   ]);
    // }

    // Process roles
    for (const item of roles.items) {
      let userEmails = []; // always defined as an array

      if (item.users && item.users.length > 0) {
        userEmails = item.users.map((uid) => userUidToEmailMap[uid] || uid);
        item.user_emails = userEmails;
      }

      // Now this is always safe to call
      roleSheet.addRow([
        item.name,
        item.description,
        item.owner,
        userEmails.join(', '),
      ]);
    }

    console.log('All Roles added to Excel');
  } catch (error) {
    console.error('Error in getRoles:', error);
    return [];
  }
};

module.exports = getRoles;
