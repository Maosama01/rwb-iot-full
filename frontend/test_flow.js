/* global require, __dirname */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  
  console.log('Switching to Register...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const registerBtn = buttons.find(b => b.textContent.includes('Create Account'));
    if (registerBtn) registerBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Filling form...');
  await page.type('input[placeholder="Jane Doe"]', 'Test E2E User');
  await page.type('input[placeholder="you@example.com"]', `e2e_${Date.now()}@test.com`);
  await page.type('input[placeholder="+1234567890"]', `+1${Math.floor(Math.random() * 10000000000)}`);
  await page.type('input[placeholder="••••••••"]', 'Password123!');
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.textContent.includes('Create Account') && b.type === 'submit');
    if (submitBtn) submitBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Switching to Sign In...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent.includes('Sign In') && b.type === 'button');
    if (signInBtn) signInBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Logging in...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.textContent.includes('Sign In') && b.type === 'submit');
    if (submitBtn) submitBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  if (currentUrl.includes('/dashboard')) {
    console.log('Successfully reached dashboard.');
    
    // Check if 'Pair Demo Device' is visible
    const pairDemoExists = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('*')).map(el => el.textContent);
      return texts.some(t => t.includes('Pair Demo Device'));
    });
    
    if (pairDemoExists) {
      console.log('Pairing demo device...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const pairBtn = buttons.find(b => b.textContent.includes('Pair Demo Device'));
        if (pairBtn) pairBtn.click();
      });
      await new Promise(r => setTimeout(r, 6000)); // wait for simulator to pump data
    }
    
    await page.screenshot({ path: path.join(__dirname, 'e2e_dashboard_success.png') });
    console.log('Dashboard screenshot captured.');
  } else {
    console.log('Failed to reach dashboard.');
    await page.screenshot({ path: path.join(__dirname, 'e2e_login_failed.png') });
  }

  await browser.close();
})();
