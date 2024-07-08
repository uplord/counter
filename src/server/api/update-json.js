import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  // Get data from the request body
  const body = await readBody(event);

  // Define the path to your JSON file
  const jsonFilePath = path.resolve('json/data.json');

  try {
    // Read the existing data
    const data = await fs.readFile(jsonFilePath, 'utf-8');
    const json = JSON.parse(data);

    // Update the JSON data
    const updatedJson = { ...json, ...body };

    // Write the updated data back to the file
    await fs.writeFile(jsonFilePath, JSON.stringify(updatedJson, null, 2), 'utf-8');

    // Return a response
    return {
      success: true,
      message: 'JSON file updated successfully',
      data: updatedJson
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update JSON file',
      error: error.message
    };
  }
});
