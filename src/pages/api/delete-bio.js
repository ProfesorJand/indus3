import fs from 'node:fs/promises';
import path from 'node:path';

export const POST = async ({ request }) => {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'src/data/biografias.json');
    
    let bios = [];
    const fileContent = await fs.readFile(filePath, 'utf-8');
    bios = JSON.parse(fileContent);

    const updatedBios = bios.filter(b => b.id !== id);
    
    await fs.writeFile(filePath, JSON.stringify(updatedBios, null, 2));

    return new Response(JSON.stringify({ message: 'Deleted' }), {
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
