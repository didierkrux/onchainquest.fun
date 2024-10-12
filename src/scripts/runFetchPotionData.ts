import { fetchPotionData } from '../utils/index';

async function main() {
  try {
    const data: any = await fetchPotionData();
    console.log('Potion data:', JSON.stringify(data, null, 2));
    // Extract and save data to data.json
    const fs = require('fs');
    const path = require('path');

    // Write the transformed data to data.json
    const dataPath = path.join(__dirname, '..', '..', 'src', 'translation', 'en', 'data.json');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    // TODO: translate to thai w/ GPT-4
    // prompt: translate to thai except the following fields: time, image, link, action, condition

    console.log('Data saved to data.json');
  } catch (error) {
    console.error('Failed to fetch Potion data:', error);
  }
}

main();
