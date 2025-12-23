import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatPersianDate, formatPersianDateTime, formatPersianTime, formatPersianCurrency, toPersianNumbers } from '@/lib/utils';

const PersianFormattingTest: React.FC = () => {
  const { t } = useTranslation();
  const testDate = new Date('2025-12-20T15:30:00');
  const testAmount = 1234567.89;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{t('test.title')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.dateFormatting')}:</h3>
          <p>Short: {formatPersianDate(testDate, 'short')}</p>
          <p>Medium: {formatPersianDate(testDate, 'medium')}</p>
          <p>Long: {formatPersianDate(testDate, 'long')}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.dateTimeFormatting')}:</h3>
          <p>Full: {formatPersianDateTime(testDate)}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.timeFormatting')}:</h3>
          <p>Time: {formatPersianTime(testDate)}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.currencyFormatting')}:</h3>
          <p>IRT: {formatPersianCurrency(testAmount, 'IRT')}</p>
          <p>USD: {formatPersianCurrency(testAmount, 'USD')}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.numberFormatting')}:</h3>
          <p>Regular: {toPersianNumbers('1234567890')}</p>
          <p>Decimal: {toPersianNumbers('1234.56')}</p>
          <p>Amount: {toPersianNumbers(testAmount.toString())}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('test.relativeTime')}:</h3>
          <p>Now: {formatPersianDate(new Date())}</p>
          <p>Yesterday: {formatPersianDate(new Date(Date.now() - 24 * 60 * 60 * 1000))}</p>
        </div>
      </div>
    </div>
  );
};

export default PersianFormattingTest;