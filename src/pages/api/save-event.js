import fs from 'node:fs/promises';
import path from 'node:path';

export const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'src/data/events.json');
    
    // Read existing file
    let events = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      events = JSON.parse(fileContent);
    } catch (e) {
      // If file doesn't exist or is empty, start fresh
      events = [];
    }

    // Update or Add
    const index = events.findIndex(e => e.id === data.id);
    if (index !== -1) {
      events[index] = data;
    } else {
      events.push(data);
    }

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(events, null, 2));

    return new Response(JSON.stringify({ message: 'Success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
