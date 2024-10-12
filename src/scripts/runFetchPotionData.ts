import { fetchPotionData } from '../utils/index';

async function main() {
  try {
    const data: any = await fetchPotionData();
    console.log('Potion data:', JSON.stringify(data, null, 2));
    // Extract and save data to data.json
    const fs = require('fs');
    const path = require('path');

    // Transform the data to match the structure in data.json
    const transformedData = {
      agenda: data.filter((item: any) => item.fields.Type === 'Agenda').map((item: any) => ({
        title: item.fields.Label,
        time: item.fields.Time,
        location: item.fields.Location,
      })),
      sponsors: data.filter((item: any) => item.fields.Type === 'Sponsor').map((item: any) => ({
        name: item.fields.Label,
        description: item.fields.Description,
        image: item.fields.Image || '',
        link: item.fields.Link || ''
      })),
      venue: data.filter((item: any) => item.fields.Type === 'Map').map((item: any) => ({
        name: item.fields.Label,
        image: item.fields.Image || '',
      })),
      booths: data.filter((item: any) => item.fields.Type === 'Booth').map((item: any) => ({
        name: item.fields.Label,
        description: item.fields.Description
      })),
      tasks: data.filter((item: any) => item.fields.Type === 'Task').map((item: any) => ({
        name: item.fields.Label,
        points: item.fields.Points,
        description: item.fields.Description,
        action: item.fields.Action,
        condition: item.fields.Condition,
      })),
      prizes: data.filter((item: any) => item.fields.Type === 'Prize').map((item: any) => ({
        name: item.fields.Label,
        description: item.fields.Description
      }))
    };

    // Write the transformed data to data.json
    const dataPath = path.join(__dirname, '..', '..', 'src', 'translation', 'en', 'data.json');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(transformedData, null, 2));

    // TODO: translate to thai w/ GPT-4
    // prompt: translate to thai except the following fields: time, image, link, action, condition

    console.log('Data saved to data.json');
  } catch (error) {
    console.error('Failed to fetch Potion data:', error);
  }
}

main();
