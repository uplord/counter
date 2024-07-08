import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const jsonFilePath = path.resolve(query.file || 'data.json');

  try {
    const data = await fs.readFile(jsonFilePath, 'utf-8');
    const json = JSON.parse(data);

    return {
      success: true,
      data: json
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to read JSON file',
      error: error.message
    };
  }
});
