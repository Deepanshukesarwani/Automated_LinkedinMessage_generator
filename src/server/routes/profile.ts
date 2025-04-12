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
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const { searchUrl } = req.body;
    if (!searchUrl) {
      return res.status(400).json({ error: 'LinkedIn search URL is required' });
    }

    console.log('Navigating to LinkedIn login...');
    await page.goto('https://www.linkedin.com/login');
    await page.waitForLoadState('networkidle');

    // Wait for user to login manually (check if we're on the feed page)
    console.log('Waiting for manual login...');
    await page.waitForFunction(
      () => window.location.href.includes('linkedin.com/feed'),
      { timeout: 60000 } // 1 minute timeout for login
    );

    console.log('Successfully logged in, navigating to search URL...');
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');

    // Wait for search results to load
    await page.waitForSelector('.search-results-container', { timeout: 30000 });

    // Scroll to load more results (20 profiles)
    console.log('Loading more results...');
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000); // Increased delay between scrolls
    }

    // Extract profile data with more specific selectors
    console.log('Extracting profile data...');
    const profiles = await page.evaluate(() => {
      const results: any[] = [];
      // Updated selector for search results
      const cards = document.querySelectorAll('.entity-result__item');

      cards.forEach((card) => {
        try {
          // Updated selectors based on LinkedIn's current structure
          const nameEl = card.querySelector('.entity-result__title-text a span span');
          const titleEl = card.querySelector('.entity-result__primary-subtitle');
          const locationEl = card.querySelector('.entity-result__secondary-subtitle');
          const profileLinkEl = card.querySelector('.entity-result__title-text a');

          if (nameEl && titleEl && locationEl && profileLinkEl) {
            const fullTitle = titleEl.textContent?.trim() || '';
            // Handle cases where 'at' isn't present
            const titleParts = fullTitle.split(' at ');
            const jobTitle = titleParts[0].trim();
            const company = titleParts.length > 1 ? titleParts[1].trim() : '';

            const profileUrl = profileLinkEl.getAttribute('href');
            if (profileUrl) {
              results.push({
                fullName: nameEl.textContent?.trim(),
                jobTitle,
                company,
                location: locationEl.textContent?.trim(),
                profileUrl: profileUrl.split('?')[0], // Remove query parameters
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          console.error('Error processing card:', error);
        }
      });

      return results;
    });

    console.log(`Found ${profiles.length} profiles`);

    // Save profiles to database
    const savedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        if (!profile.profileUrl) return null;

        try {
          return await Profile.findOneAndUpdate(
            { profileUrl: profile.profileUrl },
            { 
              ...profile,
              searchQuery: searchUrl,
              lastScraped: new Date()
            },
            { upsert: true, new: true }
          );
        } catch (error) {
          console.error('Error saving profile:', error);
          return null;
        }
      })
    );

    const validProfiles = savedProfiles.filter(Boolean);
    console.log(`Successfully saved ${validProfiles.length} profiles`);

    res.json(validProfiles);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Always close the browser
    try {
      await browser.close();
    } catch (error) {
      console.error('Error closing browser:', error);
    }
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