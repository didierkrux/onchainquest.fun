interface PotionResponse {
  results: any[]; // You may want to define a more specific type based on the actual response structure
}

async function fetchPotionData(): Promise<PotionResponse> {
  const url = 'https://potion.banklessacademy.com/table?id=37a9e401c55747d29af74e5d4d9f5c5b';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: PotionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from Potion API:', error);
    throw error;
  }
}

export default fetchPotionData;
