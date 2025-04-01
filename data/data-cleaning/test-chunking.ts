import * as fs from "fs";
import path from "path";

interface Article {
  text: string;
  metadata: {
    source: string;
    articleIndex: number;
    url: string; // Added URL field
  };
}

const sourceUrl = "https://confluence.arcon.ch/display/ISMS/ISMS+der+ARCON+Informatik+AG?preview=/1245264/89129114/ISO%2027001%20Norm%202022%20deutsche%20Fassung.pdf";

// Reading the file
const filePath = path.join(__dirname, "../Data-for-RAG/ISO-27002-Norm.txt");

if (!fs.existsSync(filePath)) {
  console.error("File does not exist:", filePath);
  process.exit(1);
}

const newDoc = fs.readFileSync(filePath, "utf8");
console.log("File read successfully!");

function splitIntoArticles(text: string): string[] {
  const articles = text.split(/article----------/);
  const processedArticles: string[] = [];

  for (const article of articles) {
    let remainingText = article.trim();

    while (remainingText.length > 10000) {
      remainingText = `URL: ${sourceUrl}\n${remainingText}`;
      processedArticles.push(remainingText.slice(0, 10000));
      remainingText = remainingText.slice(10000);
    }
    if (remainingText.length > 0) {
      remainingText = `URL: ${sourceUrl}\n${remainingText}`;
      processedArticles.push(remainingText);
    }
  }
  return processedArticles;
}

// Split into articles
const newDocCollection = splitIntoArticles(newDoc);

// Create documents from articles: docs = array of articles in the format of the Article interface
const docs: Article[] = newDocCollection.map((article, index) => ({
  text: article.trim(),
  metadata: {
    source: "ISO 27001 Norm",
    articleIndex: index,
    url: sourceUrl, // Add the URL to each article's metadata
  },
}));

console.log(`Number of articles created: ${docs.length}`);
console.log(docs);