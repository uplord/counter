// server/api/update-json.js

import fs from 'fs';
import path from 'path';

// Define the event handler
export default defineEventHandler(async (event) => {
  // Ensure that the request method is POST
  if (event.node.req.method === 'POST') {
    try {
      // Read and parse the request body
      const body = await readBody(event);

      // Define the path to the JSON file
      const jsonFilePath = path.resolve(process.cwd(), 'data', 'data.json');

      // Write the updated data to the JSON file
      fs.writeFileSync(jsonFilePath, JSON.stringify(body, null, 2));

      // Respond with a success message
      return {
        success: true,
        message: 'Data updated successfully!',
      };
    } catch (error) {
      // Log error and respond with failure message
      console.error('Error updating JSON file:', error);
      return {
        success: false,
        message: 'Failed to update data',
      };
    }
  } else {
    // Method Not Allowed
    event.node.res.setHeader('Allow', ['POST']);
    event.node.res.statusCode = 405;
    return {
      success: false,
      message: `Method ${event.node.req.method} Not Allowed`,
    };
  }
});
