import express from 'express';
import { chromium } from 'playwright';
import { Profile } from '../models/Profile';

export const profileRouter = express.Router();

// Search profiles
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

// Scrape profiles from LinkedIn
profileRouter.post('/scrape', async (req, res) => {
  try {
    const { searchUrl } = req.body;
    if (!searchUrl) {
      return res.status(400).json({ error: 'LinkedIn search URL is required' });
    }

    // Launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to LinkedIn and login (you'll need to manually log in first time)
    await page.goto('https://www.linkedin.com/login');
    await page.waitForLoadState('networkidle');

    // Navigate to search URL
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');

    // Scroll to load more results (20 profiles)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    // Extract profile data
    const profiles = await page.evaluate(() => {
      const results:any = [];
      const cards = document.querySelectorAll('.reusable-search__result-container');

      cards.forEach((card) => {
        const nameEl = card.querySelector('.app-aware-link span[aria-hidden="true"]');
        const titleEl = card.querySelector('.entity-result__primary-subtitle');
        const locationEl = card.querySelector('.entity-result__secondary-subtitle');
        const profileLinkEl = card.querySelector('.app-aware-link');

        if (nameEl && titleEl && locationEl && profileLinkEl) {
          const fullTitle = titleEl.textContent?.trim() || '';
          const [jobTitle, company] = fullTitle.split(' at ').map(s => s.trim());

          results.push({
            fullName: nameEl.textContent?.trim(),
            jobTitle: jobTitle || '',
            company: company || '',
            location: locationEl.textContent?.trim(),
            profileUrl: profileLinkEl.getAttribute('href')?.split('?')[0]
          });
        }
      });

      return results;
    });

    // Close browser
    await browser.close();

    // Save profiles to database
    const savedProfiles = await Promise.all(
      profiles.map(async (profile:any) => {
        if (!profile.profileUrl?.startsWith('https://linkedin.com/in/')) {
          return null;
        }

        return Profile.findOneAndUpdate(
          { profileUrl: profile.profileUrl },
          { ...profile, searchQuery: searchUrl },
          { upsert: true, new: true }
        );
      })
    );

    res.json(savedProfiles.filter(Boolean));
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape profiles' });
  }
});

// Get all profiles
profileRouter.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});