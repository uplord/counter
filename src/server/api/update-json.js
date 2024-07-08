import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const { file, update } = getQuery(event);
  const jsonFilePath = path.resolve(process.cwd(), 'data', file); // Ensure this path is correct

  try {
    const data = await fs.readFile(jsonFilePath, 'utf-8');
    const json = JSON.parse(data);

    // Apply updates to the JSON data
    const updatedJson = { ...json, ...update };

    // Write the updated JSON back to the file
    await fs.writeFile(jsonFilePath, JSON.stringify(updatedJson, null, 2), 'utf-8');

    return {
      success: true,
      data: updatedJson,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update JSON file',
      error: error.message,
    };
  }
});