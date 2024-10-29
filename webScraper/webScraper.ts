const axios = require('axios');
const cheerio = require('cheerio');
require("dotenv").config();

// Function to log in and get cookies
async function login(url: string, username: string, password: string) {
    try {
        const { headers } = await axios.post(url, {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return headers['set-cookie'];
    } catch (error) {
        console.error('Error logging in:', error);
        return null;
    }
}

// Function to scrape data from the website
async function scrapeData(url: string, cookies: string[]) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'Cookie': cookies.join('; ')
            }
        });
        const $ = cheerio.load(data);

        // Example: Extracting all text within paragraph tags
        const scrapedData: string[] = [];
        $('p').each((_index: any, element: any) => {
            scrapedData.push($(element).text());
        });

        return scrapedData;
    } catch (error) {
        console.error('Error scraping data:', error);
        return [];
    }
}

// Main function to run the scraper and prepare data for OpenAI
async function main() {
    const loginUrl = 'https://arcon.drupal-wiki.net/login';
    const scrapeUrl = 'https://arcon.drupal-wiki.net/';
    const username = 'philippe.fuhrer@arcon.ch';
    const password = String(process.env.drupal_wiki_pw);

    const cookies = await login(loginUrl, username, password);
    if (!cookies) {
        console.error('Login failed');
        return;
    }

    const data = await scrapeData(scrapeUrl, cookies);

    // Prepare data for OpenAI model
    const trainingData = data.map(text => ({
        prompt: 'Extracted text:',
        completion: text
    }));

    console.log('Training Data:', JSON.stringify(trainingData, null, 2));
}

main();
