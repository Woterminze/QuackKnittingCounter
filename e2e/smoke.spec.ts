import { expect, test } from '@playwright/test';

// Базовый смоук. Дальше — твоя территория: Page Object, фикстуры, кейсы из концепции.
test('создать проект, добавить правило и получить напоминание', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('create-first').click();
  await page.getByTestId('field-name').fill('Шарф');
  await page.getByTestId('save-project').click();

  await expect(page.getByTestId('project-title')).toHaveText('Шарф');
  await expect(page.getByTestId('row-number')).toHaveText('1');

  await page.getByTestId('rule-field-start').fill('3');
  await page.getByTestId('rule-field-every').fill('2');
  await page.getByTestId('rule-field-times').fill('2');
  await expect(page.getByTestId('rule-preview')).toHaveText('Ряды: 3, 5');
  await page.getByTestId('rule-save').click();

  await page.getByTestId('row-plus').click();
  await page.getByTestId('row-plus').click();
  await expect(page.getByTestId('reminder-action')).toHaveText('В этом ряду: Убавка');

  // откат назад убирает напоминание, данные переживают перезагрузку
  await page.getByTestId('row-minus').click();
  await expect(page.getByTestId('reminder')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('row-number')).toHaveText('2');
});
