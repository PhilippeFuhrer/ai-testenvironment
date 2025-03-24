// types.ts
interface ZammadTicket {
    id: number;
    title: string;
    number: string;
    created_at: string;
    updated_at: string;
    // add other fields you need
  }
  
  // api.ts
  const ZAMMAD_URL = 'your-zammad-url';
  const API_TOKEN = 'your-token';
  
  export async function getTickets() {
    try {
      const response = await fetch(
        `${ZAMMAD_URL}/api/v1/tickets?expand=true&per_page=100`,
        {
          headers: {
            'Authorization': `Token token=${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const tickets: ZammadTicket[] = await response.json();
      return tickets;
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }