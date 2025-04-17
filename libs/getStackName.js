const contentstack = require('@contentstack/management');

// Modify the existing function to return a Promise with stack information
const getStackName = async (authtoken, org_uid, stack_uid) => {
  const client = contentstack.client({
    authtoken: authtoken,
  });

  try {
    const stack = await client
      .stack({ organization_uid: org_uid, api_key: stack_uid })
      .fetch();
    // Return stack information as an object
    return {
      stack_uid: stack.uid,
      stack_name: stack.name,
    };
  } catch (error) {
    console.error(`Error fetching stack ${stack_uid}:`, error.message);
    // Return null or a default object if the stack fetch fails
    return {
      stack_uid: stack_uid,
      stack_name: 'Unknown stack', // Or null
    };
  }
};

module.exports = getStackName;
