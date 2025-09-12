import React from 'react';
import QualityAnalysis from '../../components/PDFService/QualityAnalysis';

interface QualityAnalysisPageProps {
  onBack?: () => void;
}

const QualityAnalysisPage: React.FC<QualityAnalysisPageProps> = ({ onBack }) => {
  return <QualityAnalysis onBack={onBack} />;
};

export default QualityAnalysisPage;
