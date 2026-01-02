import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf');
  });

  test('should display the main heading and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('PDF Converter & Tools');
    await expect(page.locator('.subtitle')).toContainText('All-in-one PDF conversion');

    // Check navigation
    await expect(page.getByText('Image Converter')).toBeVisible();
    await expect(page.getByText('PDF Tools')).toBeVisible();
  });

  test('should display operation selector with all options', async ({ page }) => {
    const operationSelect = page.locator('.operation-select');
    await expect(operationSelect).toBeVisible();

    const operations = [
      'PDF to Images',
      'Images to PDF',
      'PDF to PowerPoint',
      'Merge PDFs',
      'Split PDF',
      'Compress PDF',
      'Delete PDF Pages',
      'Rotate PDF Pages'
    ];

    for (const operation of operations) {
      const option = operationSelect.locator(`option:has-text("${operation}")`);
      await expect(option).toBeVisible();
    }
  });

  test('should disable convert button when no file is selected', async ({ page }) => {
    const convertButton = page.locator('button[type="submit"]');
    await expect(convertButton).toBeDisabled();
  });

  test('should show features grid', async ({ page }) => {
    await expect(page.getByText('PDF to Images')).toBeVisible();
    await expect(page.getByText('Images to PDF')).toBeVisible();
    await expect(page.getByText('PDF to PPT')).toBeVisible();
    await expect(page.getByText('Merge PDFs')).toBeVisible();
    await expect(page.getByText('Split PDF')).toBeVisible();
    await expect(page.getByText('Compress PDF')).toBeVisible();
    await expect(page.getByText('Delete Pages')).toBeVisible();
    await expect(page.getByText('Rotate Pages')).toBeVisible();
  });

  test('should change operation and update UI accordingly', async ({ page }) => {
    const operationSelect = page.locator('.operation-select');

    // Test PDF to Images - should show format selector
    await operationSelect.selectOption('to-images');
    await expect(page.getByText('Output Format:')).toBeVisible();

    // Test Images to PDF - should show page size
    await operationSelect.selectOption('from-images');
    await expect(page.getByText('Page Size:')).toBeVisible();

    // Test Split PDF - should show split options
    await operationSelect.selectOption('split');
    await expect(page.getByText('Split Type:')).toBeVisible();

    // Test Delete Pages - should show page input
    await operationSelect.selectOption('delete-pages');
    await expect(page.getByText('Pages to Delete')).toBeVisible();

    // Test Rotate - should show rotation options
    await operationSelect.selectOption('rotate');
    await expect(page.getByText('Rotation:')).toBeVisible();
  });

  test('should navigate between Image and PDF converters', async ({ page }) => {
    // We're on PDF converter
    await expect(page.locator('h1')).toContainText('PDF Converter');

    // Click Image Converter nav link
    await page.getByText('Image Converter').click();
    await expect(page.locator('h1')).toContainText('Image Format Converter');

    // Go back to PDF
    await page.getByText('PDF Tools').click();
    await expect(page.locator('h1')).toContainText('PDF Converter');
  });

  test('should show reset button after file selection', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    // Select operation that accepts images
    await page.locator('.operation-select').selectOption('from-images');

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    // Reset button should be visible
    const resetButton = page.getByText('Reset');
    await expect(resetButton).toBeVisible();

    // Click reset
    await resetButton.click();

    // File should be cleared
    await expect(resetButton).not.toBeVisible();
  });

  test('should handle multiple file selection for Images to PDF', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    await page.locator('.operation-select').selectOption('from-images');

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles([filePath, filePath]); // Use same file twice for testing

    // Should show file count
    await expect(page.locator('.file-count')).toContainText('2 files selected');

    // Convert button should be enabled
    const convertButton = page.locator('button[type="submit"]');
    await expect(convertButton).toBeEnabled();
  });

  test('should show page range input when split type is range', async ({ page }) => {
    await page.locator('.operation-select').selectOption('split');

    // Initially should show "All Pages"
    const splitTypeSelect = page.locator('select').filter({ hasText: /All Pages|Page Range/ });
    await expect(splitTypeSelect).toBeVisible();

    // Select "Page Range"
    await splitTypeSelect.selectOption('range');

    // Should show page range input
    await expect(page.getByPlaceholder('1-3,5,7-9')).toBeVisible();
  });
});

test.describe('PDF Converter - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf');
  });

  test('should handle error when backend is not available', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    // Intercept the API call and return an error
    await page.route('**/pdf/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.locator('.operation-select').selectOption('from-images');

    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    const convertButton = page.locator('button[type="submit"]');
    await convertButton.click();

    // Should show error message
    await expect(page.locator('.status-error')).toBeVisible();
  });

  test('should validate delete pages input', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const fs = require('fs');

    if (!fs.existsSync(filePath)) {
      test.skip();
      return;
    }

    await page.locator('.operation-select').selectOption('delete-pages');

    // Try to submit without specifying pages
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(filePath);

    const convertButton = page.locator('button[type="submit"]');
    await convertButton.click();

    // Should show error about missing pages
    await expect(page.locator('.status-error')).toBeVisible();
  });
});
