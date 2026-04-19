import fs from 'node:fs/promises';
import path from 'node:path';

export const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'src/data/biografias.json');
    
    let bios = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      bios = JSON.parse(fileContent);
    } catch (e) {
      bios = [];
    }

    const index = bios.findIndex(b => b.id === data.id);
    if (index !== -1) {
      bios[index] = data;
    } else {
      bios.push(data);
    }

    await fs.writeFile(filePath, JSON.stringify(bios, null, 2));

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
