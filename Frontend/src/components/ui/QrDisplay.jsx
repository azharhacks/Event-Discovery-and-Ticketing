import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrDisplay({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#0F1629', light: '#FFFFFF' },
    }).catch(console.error);
  }, [value, size]);

  if (!value) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: 8, maxWidth: '100%' }}
      aria-label="Ticket QR code"
    />
  );
}
