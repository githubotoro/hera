import fs from 'fs/promises';

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

const journalPath = './src/drizzle/migrations/meta/_journal.json';

async function cleanJournal(): Promise<void> {
  try {
    const exists = await fs
      .access(journalPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      const journalContent = await fs.readFile(journalPath, 'utf8');
      const journal: Journal = JSON.parse(journalContent);

      if (journal.entries && journal.entries.length > 0) {
        journal.entries.shift(); // Remove first entry
        await fs.writeFile(journalPath, JSON.stringify(journal, null, 2));
        console.log('Successfully removed first entry from _journal.json');
      }
    }
  } catch (error) {
    console.error('Error processing _journal.json:', error);
    process.exit(1);
  }
}

cleanJournal();
