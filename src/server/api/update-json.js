import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { file } = query;
  const update = await readBody(event);
  
  if (!file || !update) {
    return {
      success: false,
      message: 'File and update parameters are required',
    };
  }

  const jsonFilePath = path.resolve(process.cwd(), 'tmp', file); // Ensure this path is correct

  try {
    await fs.writeFile(jsonFilePath, JSON.stringify(update, null, 2), 'utf-8');

    return {
      success: true,
      message: 'Data updated successfully!',
    };
  } catch (error) {
    console.error('Error reading or updating JSON file:', error); // Log the detailed error

    return {
      success: false,
      message: 'Failed to update JSON file',
      error: error.message,
    };
  }
});
