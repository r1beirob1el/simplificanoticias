const Parser = require("rss-parser");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function main() {
  const parser = new Parser();
  const feeds = [
    "https://rss.cnn.com/rss/edition.rss",
    "https://feeds.bbci.co.uk/news/rss.xml"
  ];

  let items = [];
  for (let url of feeds) {
    const feed = await parser.parseURL(url);
    items.push(...feed.items);
  }

  const seen = new Set();
  items = items.filter(i => {
    if (seen.has(i.link)) return false;
    seen.add(i.link);
    return true;
  }).slice(0, 10);

  const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));
  const summarized = [];
  for (let i of items) {
    const prompt = `
Resuma em 2 parágrafos de até 50 palavras cada:
"${i.contentSnippet || i.content}"
Leia mais: ${i.link}
    `;
    const resp = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 200
    });
    summarized.push({
      title: i.title,
      url: i.link,
      summary: resp.data.choices[0].text.trim(),
      date: i.isoDate
    });
  }

  fs.writeFileSync("src/data/news.json", JSON.stringify(summarized, null, 2));
  console.log("✅ news.json atualizado");
}

main().catch(console.error);
