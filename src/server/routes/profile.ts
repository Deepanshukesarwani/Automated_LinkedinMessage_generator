import express from 'express';
import { chromium } from 'playwright';
import { Profile } from '../models/Profile';

export const profileRouter = express.Router();

const randomDelay = async (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  await new Promise(resolve => setTimeout(resolve, delay));
};

const typeWithDelay = async (page: any, selector: string, text: string) => {
  await page.click(selector);
  for (const char of text) {
    await page.type(selector, char, { delay: Math.random() * 100 + 50 });
    await randomDelay(50, 150);
  }
};

profileRouter.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const profiles = await Profile.find({
      searchQuery: { $regex: query, $options: 'i' }
    });

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search profiles' });
  }
});

profileRouter.post('/scrape', async (req, res) => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();

  try {
    const { searchUrl, email, password } = req.body;
    
    if (!searchUrl || !email || !password) {
      return res.status(400).json({ error: 'LinkedIn search URL, email and password are required' });
    }

    console.log('Starting LinkedIn automation...');
    
    await page.goto('https://www.linkedin.com/login');
    await randomDelay(2000, 4000);

    await typeWithDelay(page, '#username', email);
    await randomDelay(1000, 2000);
    await typeWithDelay(page, '#password', password);
    await randomDelay(1000, 2000);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);

    await randomDelay(5000, 8000);

    console.log('Successfully logged in, navigating to search URL...');
    await page.goto(searchUrl);
    await randomDelay(3000, 5000);

    // Updated selector for search results container
    await page.waitForSelector('.search-results-container', { timeout: 30000 });

    console.log('Loading more results...');
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, Math.floor(Math.random() * 400 + 300));
      });
      await randomDelay(1500, 3000);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(2000, 4000);

    console.log('Extracting profile data...');
    const profiles = await page.evaluate(() => {
      const results: any[] = [];
      // Updated selector for profile cards
      const cards = document.querySelectorAll('li.reusable-search__result-container');
      
      console.log('Found cards:', cards.length); // Debug log

      cards.forEach((card, index) => {
        try {
          // Updated selectors based on current LinkedIn structure
          const nameEl = card.querySelector('span[dir="ltr"] > span[aria-hidden="true"]');
          const titleEl = card.querySelector('.entity-result__primary-subtitle');
          const locationEl = card.querySelector('.entity-result__secondary-subtitle');
          const profileLinkEl = card.querySelector('a.app-aware-link');
          
          // Debug logs
          console.log(`Processing card ${index + 1}:`);
          console.log('Name element:', nameEl?.textContent);
          console.log('Title element:', titleEl?.textContent);
          console.log('Location element:', locationEl?.textContent);
          console.log('Profile link:', profileLinkEl?.getAttribute('href'));

          if (nameEl && titleEl && locationEl && profileLinkEl) {
            const fullTitle = titleEl.textContent?.trim() || '';
            const titleParts = fullTitle.split(' at ').map(part => part.trim());
            const jobTitle = titleParts[0];
            const company = titleParts[1] || '';

            const profileUrl = profileLinkEl.getAttribute('href');
            if (profileUrl) {
              results.push({
                fullName: nameEl.textContent?.trim(),
                jobTitle,
                company,
                location: locationEl.textContent?.trim(),
                profileUrl: profileUrl.split('?')[0],
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          console.error(`Error processing card ${index + 1}:`, error);
        }
      });

      return results;
    });

    console.log(`Found ${profiles.length} profiles`);

    const savedProfiles = [];
    for (const profile of profiles) {
      if (!profile.profileUrl) continue;

      try {
        const savedProfile = await Profile.findOneAndUpdate(
          { profileUrl: profile.profileUrl },
          { 
            ...profile,
            searchQuery: searchUrl,
            lastScraped: new Date()
          },
          { upsert: true, new: true }
        );
        savedProfiles.push(savedProfile);
        await randomDelay(300, 600);
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }

    console.log(`Successfully saved ${savedProfiles.length} profiles`);

    await randomDelay(2000, 4000);
    res.json(savedProfiles);

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    try {
      await randomDelay(1000, 2000);
      await browser.close();
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
});

profileRouter.post('/add', async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const profile = new Profile(req.body);

    await profile.save();
    res.status(201).json(profile);
  } catch (error:any) {
    console.error('Error adding profile:', error.message);
    res.status(400).json({ 
      error: error.message,
      details: error.errors || null
    });
  }
});

profileRouter.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// export default profileRouter;