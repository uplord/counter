import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const jsonFilePath = path.resolve(process.cwd(), 'data', body.file || 'data.json');

  try {
    const data = await fs.readFile(jsonFilePath, 'utf-8');
    const json = JSON.parse(data);

    const updatedJson = { ...json, ...body };
    delete updatedJson.file;

    await fs.writeFile(jsonFilePath, JSON.stringify(updatedJson, null, 2), 'utf-8');

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
