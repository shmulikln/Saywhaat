
import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Using SVG for better scalability

interface QRCodeDisplayProps {
  url: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url }) => {
  if (!url) return null;

  return (
    <div className="p-2 bg-white rounded-lg shadow-md inline-block">
      <QRCodeSVG 
        value={url} 
        size={128} 
        bgColor={"#ffffff"} 
        fgColor={"#000000"} 
        level={"L"} // Error correction level
        includeMargin={false} 
      />
    </div>
  );
};

export default React.memo(QRCodeDisplay);
