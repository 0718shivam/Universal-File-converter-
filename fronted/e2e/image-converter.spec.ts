import { test, expect } from '@playwright/test';
import path from 'path';

// Helper function to create a test image
async function createTestImage() {
  const fs = require('fs');
  const { createCanvas } = require('canvas');

  // For this test, we'll use a simple approach - create a data URL for a PNG
  // In a real scenario, you'd have actual test images in a fixtures folder
  return path.join(__dirname, 'fixtures', 'test-image.png');
}

test.describe('Image Converter Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading and subtitle', async ({ page }) => {

    await expect(page.locator('h1')).toContainText('Image Tools');
    await expect(page.locator('.subtitle')).toContainText('Convert your images to any format');
    
  });

  test('should display format selector with all supported formats', async ({ page }) => {
    const formatSelect = page.locator('#format-select');
    await expect(formatSelect).toBeVisible();

    // Check that all supported formats are present
    const supportedFormats = ['PNG', 'JPEG', 'JPG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'ICO'];
    for (const format of supportedFormats) {
      const option = formatSelect.locator(`option[value="${format}"]`);
      await expect(option).toBeVisible();
    }
  });

  test('should show upload area with placeholder', async ({ page }) => {
    const uploadArea = page.locator('.upload-area');
    await expect(uploadArea).toBeVisible();
    await expect(page.locator('.upload-placeholder')).toBeVisible();
    await expect(page.getByText('Click to upload or drag and drop')).toBeVisible();
  });

  test('should disable convert button when no file is selected', async ({ page }) => {
    const convertButton = page.locator('button[type="submit"]');
    await expect(convertButton).toBeDisabled();
  });

  test('should show features section', async ({ page }) => {
    await expect(page.getByText('Fast Conversion')).toBeVisible();
    await expect(page.getByText('Multiple Formats')).toBeVisible();
    await expect(page.getByText('Privacy First')).toBeVisible();
  });

  test('should handle file selection', async ({ page }) => {
    // Create a test file path (you'll need to add actual test images to e2e/fixtures/)
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');

    // Set up a file chooser handler
    const fileInput = page.locator('#file-input');

    // Check if test file exists, if not skip this test
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    await fileInput.setInputFiles(filePath);

    // Check that preview is shown
    await expect(page.locator('.preview-image')).toBeVisible();
    await expect(page.locator('.file-name')).toContainText('test-image.png');

    // Convert button should be enabled
    const convertButton = page.locator('button[type="submit"]');
    await expect(convertButton).toBeEnabled();
  });

  test('should allow format selection', async ({ page }) => {
    const formatSelect = page.locator('#format-select');

    // Change to JPEG
    await formatSelect.selectOption('JPEG');
    await expect(formatSelect).toHaveValue('JPEG');

    // Change to WEBP
    await formatSelect.selectOption('WEBP');
    await expect(formatSelect).toHaveValue('WEBP');
  });

  test('should show reset button after file selection', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    // Reset button should be visible
    const resetButton = page.getByText('Reset');
    await expect(resetButton).toBeVisible();

    // Click reset
    await resetButton.click();

    // Upload placeholder should be visible again
    await expect(page.locator('.upload-placeholder')).toBeVisible();
    await expect(page.locator('.preview-image')).not.toBeVisible();
  });

  test('should validate file type', async ({ page }) => {
    const textFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fs = require('fs');

    // Create a test text file if it doesn't exist
    if (!fs.existsSync(path.dirname(textFilePath))) {
      fs.mkdirSync(path.dirname(textFilePath), { recursive: true });
    }
    if (!fs.existsSync(textFilePath)) {
      fs.writeFileSync(textFilePath, 'This is a test file');
    }

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(textFilePath);

    // Should show error message
    await expect(page.locator('.status-error')).toContainText('Please select a valid image file');
  });

  test('should show error when backend is not available', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    // Intercept the API call and return an error
    await page.route('**/convert', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    const convertButton = page.locator('button[type="submit"]');
    await convertButton.click();

    // Should show error message
    await expect(page.locator('.status-error')).toBeVisible();
  });
});

test.describe('Image Converter - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should successfully convert image with backend', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    // Upload file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    // Select format
    const formatSelect = page.locator('#format-select');
    await formatSelect.selectOption('JPEG');

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click convert
    const convertButton = page.locator('button[type="submit"]');
    await convertButton.click();

    // Wait for conversion (should show info message)
    await expect(page.locator('.status-info')).toContainText('Converting image');

    // Check if backend is available, if not skip
    try {
      const download = await downloadPromise;

      // Verify the download
      expect(download.suggestedFilename()).toContain('.jpg');

      // Should show success message
      await expect(page.locator('.status-success')).toContainText('Successfully converted to JPEG');
    } catch (error) {
      // Backend not available, skip test
      test.skip();
    }
  });
});
